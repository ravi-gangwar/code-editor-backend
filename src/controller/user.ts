import { Request, Response } from "express";
import { signToken } from "../lib/jwt";

// Google OAuth callback handler
const googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as any;
        
        if (!user) {
            res.status(401).json({ message: "Authentication failed" });
            return;
        }

        // Generate JWT token
        const token = await signToken(user.id);
        
        // Redirect to frontend with token or send JSON response
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&email=${user.email}&name=${user.name}`);
    } catch (error) {
        console.error("Google OAuth callback error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export { googleCallback };
