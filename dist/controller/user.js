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
const client_1 = require("@prisma/client");
const zod_1 = require("../types/zod");
const zod_2 = require("../types/zod");
const emailTransporter_1 = __importDefault(require("../lib/emailTransporter"));
const zod_3 = require("zod");
const bcrypt_1 = require("../lib/bcrypt");
const jwt_1 = require("../lib/jwt");
const prisma = new client_1.PrismaClient();
// signup
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = zod_2.signupSchema.parse(req.body);
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const hp = yield (0, bcrypt_1.hashedPassword)(password);
        const user = yield prisma.user.create({
            data: { email, password: hp, name },
        });
        const token = yield (0, jwt_1.signToken)(user.id);
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
    console.log(email, password);
    const user = yield prisma.user.findUnique({ where: { email } });
    console.log(user);
    if (user === null) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }
    ;
    const isPasswordValid = yield (0, bcrypt_1.verifyPassword)(password, user.password);
    console.log(isPasswordValid);
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
    const { email } = zod_1.sendResetPasswordEmailSchema.parse(req.body);
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }
    const token = yield (0, jwt_1.signToken)(user.id);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Password",
        html: `
            <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
        `,
    };
    yield emailTransporter_1.default.sendMail(mailOptions);
    res.json({ message: "Reset password email sent" });
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
    const token = req.headers.authorization;
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const decoded = yield (0, jwt_1.verifyToken)(token);
    if (typeof decoded === "string") {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const user = yield prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    res.json({ data: { email: user.email, name: user.name } });
});
exports.getUser = getUser;
