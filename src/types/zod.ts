import { z } from "zod";

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const resetPasswordSchema = z.object({
    email: z.string().email(),
    newPassword: z.string().min(8),
});

export const sendResetPasswordEmailSchema = z.object({
    email: z.string().email(),
});

export const deleteUserSchema = z.object({
    email: z.string().email(),
});

export const ExecuteSchema = z.object({
    code: z.string().min(1, "Code is required"),
    language: z.enum(["javascript", "python", "java"], {
        errorMap: () => ({ message: "Language must be javascript, python, or java" }),
    }),
    type: z.enum(["sumission", "execution"], {
        errorMap: () => ({ message: "Type must be sumission or execution" }),
    }),
});
