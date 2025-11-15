"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const code_1 = __importDefault(require("./routes/v1/code"));
const user_1 = __importDefault(require("./routes/v1/user"));
const websocket_1 = __importDefault(require("./routes/v1/websocket"));
const rateLiminting_1 = require("./middleware/rateLiminting");
const middleware_1 = require("./config/middleware");
const passport_1 = require("./config/passport");
const websocketServer_1 = require("./ws/websocketServer");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Setup middleware
(0, middleware_1.setupMiddleware)(app);
// Configure Passport
(0, passport_1.configurePassport)();
// Routes
app.get("/", (req, res) => {
    res.send("Hello World");
});
app.use("/api/v1/code", code_1.default);
app.use("/api/v1/auth", rateLiminting_1.authRateLimiter, user_1.default);
// Initialize WebSocket server
(0, websocketServer_1.initializeWebSocket)(server);
app.use("/api/v1/ws", websocket_1.default);
// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Socket.IO server is ready on ws://localhost:${PORT}`);
});
