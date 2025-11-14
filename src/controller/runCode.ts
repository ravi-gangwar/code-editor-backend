import { Request, Response } from "express";
import axios from "axios";

export enum SupportedLanguage {
    JAVASCRIPT = "javascript",
    JS = "js",
    PYTHON = "python",
    PY = "py",
    LUA = "lua",
    PHP = "php",
    WASM = "wasm",
    C = "c",
    CPP = "cpp",
    RUST = "rust",
    GO = "go",
    ZIG = "zig",
    JAVA = "java",
}

export interface RunRequest {
    lang: string;
    code: string;
}

export interface RunResponse {
    id: string;
    lang: string;
    output?: string;
    error?: string;
}

const runCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lang, code } = req.body as unknown as RunRequest;

        if (!lang || !code) {
            res.status(400).json({ error: "Lang and code are required" });
            return;
        }

        const EXECUTE_BACKEND = process.env.EXECUTE_BACKEND || "";
        const response = await axios.post(EXECUTE_BACKEND, { lang, code });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export default runCode;