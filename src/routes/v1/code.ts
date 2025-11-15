import { Router } from "express";
import runCode from "../../controller/runCode";

const codeRouter = Router();

codeRouter.post("/run", runCode);

export default codeRouter;
