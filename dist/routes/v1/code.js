"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const codeSandbox_1 = __importDefault(require("../../controller/codeSandbox"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const codeRouter = (0, express_1.Router)();
// Use the router as middleware
codeRouter.use("/execute", auth_1.default, codeSandbox_1.default);
exports.default = codeRouter;
