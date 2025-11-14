import { Router } from "express";
import { login, resetPassword, sendResetPasswordEmail, signup, deleteUser, getUser, googleCallback } from "../../controller/user";
import passport from "passport";

const authRouter = Router();

// Google OAuth routes
authRouter.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

authRouter.get("/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    googleCallback
);

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/send-reset-password-email", sendResetPasswordEmail);
authRouter.post("/delete-user", deleteUser);
authRouter.get("/user", getUser);

export default authRouter;
