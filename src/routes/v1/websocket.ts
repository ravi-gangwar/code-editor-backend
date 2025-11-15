import express from "express";
import { broadcastToKey, getConnectionsCount } from "../../ws/websocketServer";

const router = express.Router();

// REST endpoint to broadcast to a specific key
router.post("/broadcast", express.json(), async (req: express.Request, res: express.Response) => {
    try {
        const { key, data } = req.body;

        if (!key) {
            res.status(400).json({ error: "Key is required" });
            return;
        }

        const sentCount = await broadcastToKey(key, data || req.body);
        
        res.json({
            success: true,
            message: `Broadcast sent to ${sentCount} connection(s)`,
            recipients: sentCount
        });
    } catch (error: any) {
        console.error("Error broadcasting:", error);
        res.status(500).json({ error: "Failed to broadcast message" });
    }
});

// Get connection count for a key
router.get("/connections/:key", (req: express.Request, res: express.Response) => {
    try {
        const { key } = req.params;
        const count = getConnectionsCount(key);
        
        res.json({
            key,
            connections: count
        });
    } catch (error: any) {
        console.error("Error getting connections:", error);
        res.status(500).json({ error: "Failed to get connection count" });
    }
});

export default router;
