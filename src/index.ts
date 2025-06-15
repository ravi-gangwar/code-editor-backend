import dotenv from "dotenv";
dotenv.config();

import express from "express";
import codeRouter from "./routes/v1/code";
import authRouter from "./routes/v1/user";
import cors from "cors";
import { WebSocketServer, WebSocket } from 'ws';
import handleMessage from "./ws/handleMessage";
import { rateLimiter, authRateLimiter } from "./middleware/rateLiminting";

const wss = new WebSocketServer({ port: 8080 });
const app = express();

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message) => {
        handleMessage(message.toString(), ws);
    });
});

app.use(express.json());
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "authorization"],
}));

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/api/v1/code", rateLimiter, codeRouter);
app.use("/api/v1/auth", authRateLimiter, authRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
