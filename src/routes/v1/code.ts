import { Router } from "express";
import { executeCode, getSubmissions } from "../../controller/codeSandbox";
import authMiddleware from "../../middleware/auth";
import runCode from "../../controller/runCode";

const codeRouter = Router();

// Use the router as middleware
codeRouter.post("/execute", authMiddleware, executeCode);
codeRouter.get("/submissions", authMiddleware, getSubmissions);
codeRouter.post("/run", runCode);

export default codeRouter;
