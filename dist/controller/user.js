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
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = void 0;
const jwt_1 = require("../lib/jwt");
// Google OAuth callback handler
const googleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "Authentication failed" });
            return;
        }
        // Generate JWT token
        const token = yield (0, jwt_1.signToken)(user.id);
        // Redirect to frontend with token or send JSON response
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&email=${user.email}&name=${user.name}`);
    }
    catch (error) {
        console.error("Google OAuth callback error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.googleCallback = googleCallback;
