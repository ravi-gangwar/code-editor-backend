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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const code_1 = __importDefault(require("./routes/v1/code"));
const user_1 = __importDefault(require("./routes/v1/user"));
const cors_1 = __importDefault(require("cors"));
const rateLiminting_1 = require("./middleware/rateLiminting");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "authorization"],
}));
// Configure PostgreSQL session store
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: "user_sessions", // Optional: custom table name
    createTableIfMissing: true, // Automatically create the sessions table
});
// Configure session middleware
app.use((0, express_session_1.default)({
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
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Configure Google OAuth Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        const name = profile.displayName || ((_c = profile.name) === null || _c === void 0 ? void 0 : _c.givenName) || "User";
        if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
        }
        // Check if user exists
        let user = yield prisma.user.findUnique({
            where: { email }
        });
        // If user doesn't exist, create a new one
        if (!user) {
            user = yield prisma.user.create({
                data: {
                    email,
                    name,
                    password: null // OAuth users don't have passwords
                }
            });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, undefined);
    }
})));
app.get("/", (req, res) => {
    res.send("Hello World");
});
// Serialize user for session
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from session
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true }
        });
        done(null, user);
    }
    catch (error) {
        done(error, undefined);
    }
}));
app.use("/api/v1/code", code_1.default);
app.use("/api/v1/auth", rateLiminting_1.authRateLimiter, user_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
