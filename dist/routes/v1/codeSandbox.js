"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dockerode_1 = __importDefault(require("dockerode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const zod_1 = require("zod");
const codeRouter = (0, express_1.Router)();
const docker = new dockerode_1.default();
const ExecuteSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Code is required"),
    language: zod_1.z.enum(["javascript", "python", "java"], {
        errorMap: () => ({ message: "Language must be javascript, python, or java" }),
    }),
});
codeRouter.post("/execute", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = ExecuteSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ error: validation.error.errors[0].message });
        return;
    }
    const { code, language } = validation.data;
    try {
        const scriptDir = path_1.default.join(__dirname, "app");
        if (!fs_1.default.existsSync(scriptDir)) {
            fs_1.default.mkdirSync(scriptDir, { recursive: true });
        }
        let fileName = "";
        let compileCmd = "";
        let runCmd = [];
        if (language === "javascript") {
            fileName = "script.js";
            runCmd = ["node", `/app/${fileName}`];
        }
        else if (language === "python") {
            fileName = "script.py";
            runCmd = ["python3", `/app/${fileName}`];
        }
        else if (language === "java") {
            fileName = "Main.java";
            compileCmd = "javac /app/Main.java";
            runCmd = ["java", "-cp", "/app", "Main"];
        }
        const scriptPath = path_1.default.join(scriptDir, fileName);
        fs_1.default.writeFileSync(scriptPath, code);
        try {
            (0, child_process_1.execSync)("docker inspect code-sandbox");
        }
        catch (_a) {
            console.log("Building Docker image...");
            (0, child_process_1.execSync)("docker build -t code-sandbox .");
        }
        const startTime = Date.now();
        const container = yield docker.createContainer({
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
        yield container.start();
        // Set timeout to force stop if execution exceeds 5 seconds
        const timeout = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield container.stop();
                yield container.remove();
                res.status(408).json({ error: "Execution timed out (5 seconds limit)." });
            }
            catch (err) {
                console.error("Error stopping container:", err);
            }
        }), 5000);
        yield container.wait();
        clearTimeout(timeout); // Clear timeout if execution finishes in time
        const logsBuffer = yield container.logs({ stdout: true, stderr: true });
        const logs = logsBuffer.toString("utf-8").replace(/[\x00-\x1F]/g, "").trim();
        const executionTime = Date.now() - startTime;
        yield container.remove();
        res.json({
            output: logs,
            executionTime: `${executionTime}ms`,
            memoryUsage: "256MB (limit)", // TODO: Get actual memory usage
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
exports.default = codeRouter;
