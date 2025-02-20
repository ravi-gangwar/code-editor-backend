"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executionSchema = void 0;
const zod_1 = require("zod");
exports.executionSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Code is required"),
    language: zod_1.z.enum(["python", "node", "cpp"], {
        errorMap: () => ({ message: "Unsupported language. Use 'python', 'node', or 'cpp'." }),
    }),
    input: zod_1.z.string().optional(),
});
