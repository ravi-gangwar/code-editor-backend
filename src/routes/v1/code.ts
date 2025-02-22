import { Router } from "express";
import { executeCode, getSubmissions } from "../../controller/codeSandbox";
import authMiddleware from "../../middleware/auth";

const codeRouter = Router();

// Use the router as middleware
codeRouter.post("/execute", authMiddleware, executeCode);
codeRouter.get("/submissions", authMiddleware, getSubmissions);

export default codeRouter;
