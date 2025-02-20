import { Router } from "express";
import sandbox from "../../controller/codeSandbox";
import authMiddleware from "../../middleware/auth";

const codeRouter = Router();

// Use the router as middleware
codeRouter.use("/execute", authMiddleware, sandbox);

export default codeRouter;
