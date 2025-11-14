"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const codeSandbox_1 = require("../../controller/codeSandbox");
const auth_1 = __importDefault(require("../../middleware/auth"));
const runCode_1 = __importDefault(require("../../controller/runCode"));
const codeRouter = (0, express_1.Router)();
// Use the router as middleware
codeRouter.post("/execute", auth_1.default, codeSandbox_1.executeCode);
codeRouter.get("/submissions", auth_1.default, codeSandbox_1.getSubmissions);
codeRouter.post("/run", runCode_1.default);
exports.default = codeRouter;
