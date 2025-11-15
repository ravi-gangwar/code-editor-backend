import dotenv from "dotenv";
dotenv.config();

import express from "express";
import codeRouter from "./routes/v1/code";
import authRouter from "./routes/v1/user";
import cors from "cors";
import { WebSocketServer, WebSocket } from 'ws';
import handleMessage from "./ws/handleMessage";
import { rateLimiter, authRateLimiter } from "./middleware/rateLiminting";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const wss = new WebSocketServer({ port: parseInt(process.env.WS_PORT || "5001") });
const app = express();

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: Buffer) => {
        handleMessage(message.toString(), ws);
    });
    console.log("New connection");
});


app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "authorization"],
}));

// Configure PostgreSQL session store
const PgSession = connectPgSimple(session);
const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: "user_sessions", // Optional: custom table name
    createTableIfMissing: true, // Automatically create the sessions table
});

// Configure session middleware
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

app.use(passport.initialize());
app.use(passport.session());    

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

app.get("/", (req, res) => {
    res.send("Hello World");
});

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

app.use("/api/v1/code", rateLimiter, codeRouter);
app.use("/api/v1/auth", authRateLimiter, authRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
