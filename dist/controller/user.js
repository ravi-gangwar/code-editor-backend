"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.deleteUser = exports.sendResetPasswordEmail = exports.resetPassword = exports.login = exports.signup = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_1 = require("@prisma/client");
const zod_1 = require("../types/zod");
const zod_2 = require("../types/zod");
const zod_3 = require("zod");
const bcrypt_1 = require("../lib/bcrypt");
const jwt_1 = require("../lib/jwt");
const emailTransporter_1 = __importDefault(require("../lib/emailTransporter"));
const prisma = new client_1.PrismaClient();
// signup
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = zod_2.signupSchema.parse(req.body);
        console.log(email, password, name);
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        console.log({ existingUser });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const hp = yield (0, bcrypt_1.hashedPassword)(password);
        console.log(hp);
        const user = yield prisma.user.create({
            data: { email, password: hp, name },
        });
        console.log(user);
        const token = yield (0, jwt_1.signToken)(user.id);
        console.log(token);
        res.json({ token, data: { email: user.email, name: user.name, token } });
    }
    catch (error) {
        if (error instanceof zod_3.ZodError) {
            res.status(400).json({ message: "Invalid input", details: error.errors });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
exports.signup = signup;
// login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = zod_2.loginSchema.parse(req.body);
    const user = yield prisma.user.findUnique({ where: { email } });
    if (user === null) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }
    ;
    const isPasswordValid = yield (0, bcrypt_1.verifyPassword)(password, user.password);
    if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }
    ;
    const token = yield (0, jwt_1.signToken)(user.id);
    res.json({ token, data: { email: user.email, name: user.name, token } });
});
exports.login = login;
// reset password
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword } = zod_1.resetPasswordSchema.parse(req.body);
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }
    ;
    const hp = yield (0, bcrypt_1.hashedPassword)(newPassword);
    yield prisma.user.update({ where: { email }, data: { password: hp } });
    res.json({ message: "Password reset successful" });
});
exports.resetPassword = resetPassword;
// send reset password email
const sendResetPasswordEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = zod_1.sendResetPasswordEmailSchema.parse(req.body);
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = yield (0, jwt_1.signToken)(user.id);
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        // Send email using nodemailer
        yield emailTransporter_1.default.sendMail({
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
    }
    catch (error) {
        console.error('Error sending reset password email:', error);
        res.status(500).json({ message: "Failed to send reset password email" });
    }
});
exports.sendResetPasswordEmail = sendResetPasswordEmail;
// delete user with token
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.email;
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }
    ;
    yield prisma.user.delete({ where: { email } });
    res.json({ message: "User deleted successfully" });
});
exports.deleteUser = deleteUser;
// get user with token
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const decoded = yield (0, jwt_1.verifyToken)(token);
        const user = yield prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        res.json({ data: { email: user.email, name: user.name } });
    }
    catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
});
exports.getUser = getUser;
