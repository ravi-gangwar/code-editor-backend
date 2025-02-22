import Docker from "dockerode";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { Request, Response } from "express";
import langCmd from "../utils/langCmd";
import { ExecuteSchema } from "../types/zod";
import { PrismaClient } from "@prisma/client";
import generateUniqueSubmissionFingerprint from "../lib/generateHash";

const docker = new Docker();
const prisma = new PrismaClient();

export const executeCode = async (req: Request, res: Response): Promise<void> => {
    const validation = ExecuteSchema.safeParse(req.body);

    if (!validation.success) {
        res.status(400).json({ error: validation.error.errors[0].message });
        return;
    }

    const { code, language, type} = validation.data;

    try {
        const scriptDir = path.join(__dirname, "app");
        if (!fs.existsSync(scriptDir)) {
            fs.mkdirSync(scriptDir, { recursive: true });
        }

        const { fileName, compileCmd, runCmd } = langCmd(language);

        const scriptPath = path.join(scriptDir, fileName);
        fs.writeFileSync(scriptPath, code);

        try {
            execSync("docker inspect code-sandbox");
        } catch {
            console.log("Building Docker image...");
            execSync("docker build -t code-sandbox .");
        }

        const startTime = Date.now();

        const container = await docker.createContainer({
            Image: "code-sandbox",
            Cmd: compileCmd ? ["sh", "-c", `${compileCmd} && ${runCmd.join(" ")}`] : runCmd,
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
            StopTimeout: 1, // Grace period for stopping container
            HostConfig: {
                Memory: 256 * 1024 * 1024, // 256MB memory limit
                CpuQuota: 50000, // Limits CPU to 50% of a single core
                NetworkMode: "none", // No internet access
                Binds: [`${scriptPath}:/app/${fileName}:ro`], // Read-only
                Ulimits: [
                    { Name: "cpu", Soft: 50, Hard: 100 }, // Prevent CPU abuse
                    { Name: "nofile", Soft: 50, Hard: 100 }, // Limit file access
                ],
            },
        });

        await container.start();

        // Set timeout to force stop if execution exceeds 5 seconds
        const timeout = setTimeout(async () => {
            try {
                await container.stop();
                await container.remove();
                res.status(408).json({ error: "Execution timed out (5 seconds limit)." });
            } catch (err) {
                console.error("Error stopping container:", err);
            }
        }, 5000);

        await container.wait();
        clearTimeout(timeout);

        const logsBuffer = await container.logs({ stdout: true, stderr: true });
        const logs = logsBuffer.toString("utf-8").replace(/[\x00-\x1F]/g, "").trim();
        const executionTime = Date.now() - startTime;

        // Get container stats for memory usage
        const stats = await container.stats({ stream: false });
        let memoryUsage = 0;
        if (stats.memory_stats && stats.memory_stats.usage) {
            memoryUsage = Math.round(stats.memory_stats.usage / (1024 * 1024)); // Convert to MB
        }

        await container.remove();

        if(type === 'submission'){
            const fingerprint = await generateUniqueSubmissionFingerprint(req.user?.userId as string, code, Date.now(), language);

            const existingFingerprint = await prisma.executionFingerprint.findFirst({
                where: {
                    fingerprint: fingerprint,
                    userId: {
                        not: req.user?.userId as string,
                    },
                },
            });

            if(existingFingerprint){
                res.status(400).json({ error: "Duplicate submission" });
                return;
            }
            await prisma.submission.create({
                data: {
                    updatedAt: new Date(),
                    userId: req.user?.userId as string,
                    code: code,
                    language: language,
                    status: "success",
                },
            });

            await prisma.executionFingerprint.create({
                data: {
                    userId: req.user?.userId as string,
                    fingerprint: fingerprint,
                },
            });
        }

        res.json({
            output: logs,
            executionTime: `${executionTime}ms`,
            memoryUsage: `${memoryUsage}MB`,
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


export const getSubmissions = async (req: Request, res: Response): Promise<void> => {
    const submissions = await prisma.submission.findMany({
        where: {
            userId: req.user?.userId as string,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    res.json(submissions);
};
