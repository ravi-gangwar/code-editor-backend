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
exports.executeCodeInDocker = executeCodeInDocker;
const dockerode_1 = __importDefault(require("dockerode"));
const stream_1 = __importDefault(require("stream"));
const promises_1 = __importDefault(require("fs/promises"));
const docker = new dockerode_1.default({ socketPath: "/var/run/docker.sock" });
const languageConfigs = {
    python: { image: "python:3.9", fileName: "script.py", runCmd: "python3 /code/script.py" },
    node: { image: "node:18", fileName: "script.js", runCmd: "node /code/script.js" },
    cpp: { image: "gcc:latest", fileName: "script.cpp", runCmd: "g++ /code/script.cpp -o /code/a.out && /code/a.out" }
};
function executeCodeInDocker(code, language, input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!languageConfigs[language]) {
            throw new Error("Unsupported language");
        }
        const { image, fileName, runCmd } = languageConfigs[language];
        let container;
        try {
            // Create a temporary directory for code execution
            const tmpDir = `/tmp/${Date.now()}`;
            yield promises_1.default.mkdir(tmpDir, { recursive: true }); // Create directory on host system
            yield docker.run(image, ["mkdir", "-p", "/code"], process.stdout);
            // Write code file to temp directory
            yield promises_1.default.writeFile(`${tmpDir}/${fileName}`, code);
            // Create the container
            container = yield docker.createContainer({
                Image: image,
                Cmd: ["/bin/sh", "-c", runCmd],
                AttachStdout: true,
                AttachStderr: true,
                OpenStdin: true,
                Tty: false,
                HostConfig: {
                    Binds: [`${tmpDir}:/code`], // Bind mount for script storage
                    Memory: 256 * 1024 * 1024, // Limit to 256MB RAM
                    NanoCpus: 500000000, // Limit to 0.5 CPU
                    NetworkMode: 'none' // Disable network access
                }
            });
            // Start the container
            console.log("Starting container...");
            yield container.start();
            // Attach to container logs
            const logStream = new stream_1.default.PassThrough();
            const attachStream = yield container.attach({ stream: true, stdout: true, stderr: true });
            container.modem.demuxStream(attachStream, logStream, logStream);
            return new Promise((resolve, reject) => {
                let output = "";
                logStream.on("data", (chunk) => (output += chunk.toString()));
                logStream.on("end", () => __awaiter(this, void 0, void 0, function* () {
                    yield (container === null || container === void 0 ? void 0 : container.remove());
                    resolve({ output: output.trim() });
                }));
                logStream.on("error", (err) => __awaiter(this, void 0, void 0, function* () {
                    yield (container === null || container === void 0 ? void 0 : container.remove());
                    reject(err);
                }));
            });
        }
        catch (err) {
            if (container)
                yield container.remove();
            throw err;
        }
    });
}
exports.default = executeCodeInDocker;
