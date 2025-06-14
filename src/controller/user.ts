import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { resetPasswordSchema, sendResetPasswordEmailSchema } from "../types/zod";
import { loginSchema, signupSchema } from "../types/zod";
import { ZodError } from "zod";
import { hashedPassword, verifyPassword } from "../lib/bcrypt";
import { signToken, verifyToken } from "../lib/jwt";
import transporter from "../lib/emailTransporter";

const prisma = new PrismaClient();

// signup
const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = signupSchema.parse(req.body);
        console.log(email, password, name);
        const existingUser = await prisma.user.findUnique({ where: { email } });
        console.log({existingUser});
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const hp = await hashedPassword(password);
        console.log(hp);
        const user = await prisma.user.create({
            data: { email, password: hp, name },
        });
        console.log(user);

        const token = await signToken(user.id);
        console.log(token);
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (user === null) {    
        res.status(401).json({ message: "Invalid credentials" });
        return;
    };

    const isPasswordValid = await verifyPassword(password, user.password);
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
    try {
        const { email } = sendResetPasswordEmailSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const token = await signToken(user.id);
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        // Send email using nodemailer
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `Click the link below to reset your password: ${resetLink}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>We received a request to reset your password. Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                            Reset Password
                        </a>
                    </div>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>Best regards,<br>Your App Team</p>
                </div>
            `
        });

        res.json({ message: "Reset password email sent successfully" });
    } catch (error) {
        console.error('Error sending reset password email:', error);
        res.status(500).json({ message: "Failed to send reset password email" });
    }
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
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const decoded = await verifyToken(token) as { userId: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } }); 
        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        res.json({ data: { email: user.email, name: user.name } });
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
};

export { signup, login, resetPassword, sendResetPasswordEmail, deleteUser, getUser };
