import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const configurePassport = () => {
    // Configure Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID || "",
        clientSecret: process.env.CLIENT_SECRET || "",
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
        try {
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName || profile.name?.givenName || "User";
            
            if (!email) {
                return done(new Error("No email found in Google profile"), undefined);
            }

            // Check if user exists
            let user = await prisma.user.findUnique({
                where: { email }
            });

            // If user doesn't exist, create a new one
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        name,
                        password: null // OAuth users don't have passwords
                    }
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error, undefined);
        }
    }));

    // Serialize user for session
    passport.serializeUser((user: any, done: (err: any, id?: string) => void) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
                select: { id: true, email: true, name: true }
            });
            done(null, user);
        } catch (error) {
            done(error, undefined);
        }
    });
};

