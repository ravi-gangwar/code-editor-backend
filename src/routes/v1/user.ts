import { Router } from "express";
import { googleCallback } from "../../controller/user";
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

export default authRouter;
