import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import codeRouter from "./routes/v1/code";
import authRouter from "./routes/v1/user";
import wsRouter from "./routes/v1/websocket";
import { authRateLimiter } from "./middleware/rateLiminting";
import { setupMiddleware } from "./config/middleware";
import { configurePassport } from "./config/passport";
import { initializeWebSocket } from "./ws/websocketServer";

const app = express();
const server = createServer(app);

// Setup middleware
setupMiddleware(app);

// Configure Passport
configurePassport();

// Routes
app.get("/", (req: express.Request, res: express.Response) => {
    res.send("Hello World");
});

app.use("/api/v1/code", codeRouter);
app.use("/api/v1/auth", authRouter);

// Initialize WebSocket server
initializeWebSocket(server);
app.use("/api/v1/ws", wsRouter);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Socket.IO server is ready on ws://localhost:${PORT}`);
});
