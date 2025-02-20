import { z } from "zod";

export const executionSchema = z.object({
    code: z.string().min(1, "Code is required"),
    language: z.enum(["python", "node", "cpp"], {
        errorMap: () => ({ message: "Unsupported language. Use 'python', 'node', or 'cpp'." }),
    }),
    input: z.string().optional(),
});