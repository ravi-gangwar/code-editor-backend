"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executionSchema = exports.ExecuteSchema = exports.deleteUserSchema = exports.sendResetPasswordEmailSchema = exports.resetPasswordSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(1),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    newPassword: zod_1.z.string().min(8),
});
exports.sendResetPasswordEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.deleteUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.ExecuteSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Code is required"),
    language: zod_1.z.enum(["javascript", "python", "java"], {
        errorMap: () => ({ message: "Language must be javascript, python, or java" }),
    }),
    type: zod_1.z.enum(["submission", "execution"], {
        errorMap: () => ({ message: "Type must be submission or execution" }),
    }),
});
exports.executionSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Code is required"),
    language: zod_1.z.enum(["python", "node", "cpp"], {
        errorMap: () => ({ message: "Unsupported language. Use 'python', 'node', or 'cpp'." }),
    }),
    input: zod_1.z.string().optional(),
});
