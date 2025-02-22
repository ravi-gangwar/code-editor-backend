import express from "express";
import codeRouter from "./routes/v1/code";
import authRouter from "./routes/v1/user";
import dotenv from "dotenv";
import cors from "cors";
import { WebSocketServer, WebSocket } from 'ws';
import handleMessage from "./ws/handleMessage";
dotenv.config();

const wss = new WebSocketServer({ port: 8080 });
const app = express();

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message) => {
        handleMessage(message.toString(), ws);
    });
});

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL + "/*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "authorization"],
}));

app.use("/api/v1/code", codeRouter);
app.use("/api/v1/auth", authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
