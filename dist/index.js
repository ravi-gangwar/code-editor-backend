"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const code_1 = __importDefault(require("./routes/v1/code"));
const user_1 = __importDefault(require("./routes/v1/user"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const handleMessage_1 = __importDefault(require("./ws/handleMessage"));
dotenv_1.default.config();
const wss = new ws_1.WebSocketServer({ port: 8080 });
const app = (0, express_1.default)();
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        (0, handleMessage_1.default)(message.toString(), ws);
    });
});
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "authorization"],
}));
app.use(express_1.default.json());
app.use("/api/v1/code", code_1.default);
app.use("/api/v1/auth", user_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
