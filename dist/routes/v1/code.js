"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const runCode_1 = __importDefault(require("../../controller/runCode"));
const codeRouter = (0, express_1.Router)();
codeRouter.post("/run", runCode_1.default);
exports.default = codeRouter;
