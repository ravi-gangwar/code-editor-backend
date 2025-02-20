import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { resetPasswordSchema, sendResetPasswordEmailSchema } from "../types/zod";
import { loginSchema, signupSchema } from "../types/zod";
import transporter from "../lib/emailTransporter";
import { ZodError } from "zod";
import { hashedPassword, verifyPassword } from "../lib/bcrypt";
import { signToken, verifyToken } from "../lib/jwt";

const prisma = new PrismaClient();

// signup
const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = signupSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const hp = await hashedPassword(password);
        const user = await prisma.user.create({
            data: { email, password: hp, name },
        });

        const token = await signToken(user.id);
        res.json({ token, data: { email: user.email, name: user.name, token } });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: "Invalid input", details: error.errors });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

// login
const login = async (req: Request, res: Response) : Promise<void> => {
    const { email, password } = loginSchema.parse(req.body);
    console.log(email, password);
    const user = await prisma.user.findUnique({ where: { email } });
    console.log(user);
    if (user === null) {    
        res.status(401).json({ message: "Invalid credentials" });
        return;
    };

    const isPasswordValid = await verifyPassword(password, user.password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    };

    const token = await signToken(user.id);
    res.json({ token, data: { email: user.email, name: user.name, token } });
};

// reset password
const resetPassword = async (req: Request, res: Response) : Promise<void> => {
    const { email, newPassword } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    };

    const hp = await hashedPassword(newPassword);
    await prisma.user.update({ where: { email }, data: { password: hp } });

    res.json({ message: "Password reset successful" });
};

// send reset password email
const sendResetPasswordEmail = async (req: Request, res: Response): Promise<void> => {
    const { email } = sendResetPasswordEmailSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }

    const token = await signToken(user.id);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Password",
        html: `
            <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset password email sent" });
};

// delete user with token
const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const email = req.body.email;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    };
    await prisma.user.delete({ where: { email } });
    res.json({ message: "User deleted successfully" });
};

// get user with token
const getUser = async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization;
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const decoded = await verifyToken(token);
    if (typeof decoded === "string") {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    res.json({ data: { email: user.email, name: user.name } });
};

export { signup, login, resetPassword, sendResetPasswordEmail, deleteUser, getUser };
