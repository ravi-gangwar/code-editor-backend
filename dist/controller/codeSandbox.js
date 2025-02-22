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
exports.getSubmissions = exports.executeCode = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const langCmd_1 = __importDefault(require("../utils/langCmd"));
const zod_1 = require("../types/zod");
const client_1 = require("@prisma/client");
const generateHash_1 = __importDefault(require("../lib/generateHash"));
const docker = new dockerode_1.default();
const prisma = new client_1.PrismaClient();
const executeCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const validation = zod_1.ExecuteSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ error: validation.error.errors[0].message });
        return;
    }
    const { code, language, type } = validation.data;
    try {
        const scriptDir = path_1.default.join(__dirname, "app");
        if (!fs_1.default.existsSync(scriptDir)) {
            fs_1.default.mkdirSync(scriptDir, { recursive: true });
        }
        const { fileName, compileCmd, runCmd } = (0, langCmd_1.default)(language);
        const scriptPath = path_1.default.join(scriptDir, fileName);
        fs_1.default.writeFileSync(scriptPath, code);
        try {
            (0, child_process_1.execSync)("docker inspect code-sandbox");
        }
        catch (_e) {
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
        clearTimeout(timeout);
        const logsBuffer = yield container.logs({ stdout: true, stderr: true });
        const logs = logsBuffer.toString("utf-8").replace(/[\x00-\x1F]/g, "").trim();
        const executionTime = Date.now() - startTime;
        // Get container stats for memory usage
        const stats = yield container.stats({ stream: false });
        let memoryUsage = 0;
        if (stats.memory_stats && stats.memory_stats.usage) {
            memoryUsage = Math.round(stats.memory_stats.usage / (1024 * 1024)); // Convert to MB
        }
        yield container.remove();
        if (type === 'submission') {
            const fingerprint = yield (0, generateHash_1.default)((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId, code, Date.now(), language);
            const existingFingerprint = yield prisma.executionFingerprint.findFirst({
                where: {
                    fingerprint: fingerprint,
                    userId: {
                        not: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                    },
                },
            });
            if (existingFingerprint) {
                res.status(400).json({ error: "Duplicate submission" });
                return;
            }
            const submission = yield prisma.submission.create({
                data: {
                    updatedAt: new Date(),
                    userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.userId,
                    code: code,
                    language: language,
                    status: "success",
                },
            });
            yield prisma.executionFingerprint.create({
                data: {
                    userId: (_d = req.user) === null || _d === void 0 ? void 0 : _d.userId,
                    fingerprint: fingerprint,
                    submissionId: submission.id,
                },
            });
        }
        res.json({
            output: logs,
            executionTime: `${executionTime}ms`,
            memoryUsage: `${memoryUsage}MB`,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.executeCode = executeCode;
const getSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const submissions = yield prisma.submission.findMany({
        where: {
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    res.json(submissions);
});
exports.getSubmissions = getSubmissions;
