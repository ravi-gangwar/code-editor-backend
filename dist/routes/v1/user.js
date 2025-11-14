"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../../controller/user");
const passport_1 = __importDefault(require("passport"));
const authRouter = (0, express_1.Router)();
// Google OAuth routes
authRouter.get("/google", passport_1.default.authenticate("google", {
    scope: ["profile", "email"]
}));
authRouter.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/login" }), user_1.googleCallback);
authRouter.post("/signup", user_1.signup);
authRouter.post("/login", user_1.login);
authRouter.post("/reset-password", user_1.resetPassword);
authRouter.post("/send-reset-password-email", user_1.sendResetPasswordEmail);
authRouter.post("/delete-user", user_1.deleteUser);
authRouter.get("/user", user_1.getUser);
exports.default = authRouter;
