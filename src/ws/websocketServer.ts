import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import redisClient, { isRedisConnected } from './redisClient';

interface SocketConnection {
    socket: Socket;
    connectionId: string;
    uniqueId: string;
}

// Module-level state
const connections: Map<string, SocketConnection[]> = new Map();
let io: SocketIOServer | null = null;

// Helper functions
const addConnectionToRedis = async (uniqueId: string, connectionId: string) => {
    try {
        if (!isRedisConnected()) {
            console.warn('Redis not connected, skipping Redis storage');
            return;
        }

        const key = `ws:connections:${uniqueId}`;
        const existing = await redisClient.get(key);
        const connectionIds = existing ? JSON.parse(existing) : [];
        
        if (!connectionIds.includes(connectionId)) {
            connectionIds.push(connectionId);
            await redisClient.set(key, JSON.stringify(connectionIds));
        }
    } catch (error) {
        console.error('Error adding connection to Redis:', error);
    }
};

const removeConnectionFromRedis = async (uniqueId: string, connectionId: string) => {
    try {
        if (!isRedisConnected()) {
            return;
        }

        const key = `ws:connections:${uniqueId}`;
        const existing = await redisClient.get(key);
        if (existing) {
            const connectionIds = JSON.parse(existing);
            const filtered = connectionIds.filter((id: string) => id !== connectionId);
            
            if (filtered.length === 0) {
                await redisClient.del(key);
            } else {
                await redisClient.set(key, JSON.stringify(filtered));
            }
        }
    } catch (error) {
        console.error('Error removing connection from Redis:', error);
    }
};

const removeConnection = async (uniqueId: string, connectionId: string) => {
    try {
        // Remove from in-memory map
        const connectionList = connections.get(uniqueId);
        if (connectionList) {
            const filtered = connectionList.filter(conn => conn.connectionId !== connectionId);
            if (filtered.length === 0) {
                connections.delete(uniqueId);
            } else {
                connections.set(uniqueId, filtered);
            }
        }

        // Remove from Redis
        await removeConnectionFromRedis(uniqueId, connectionId);
    } catch (error) {
        console.error('Error removing connection:', error);
    }
};

const handleSocketConnection = async (socket: Socket, ioInstance: SocketIOServer) => {
    console.log('New Socket.IO connection:', socket.id);

    // Extract unique ID from handshake query
    const uniqueId = socket.handshake.query.id as string;

    if (!uniqueId) {
        socket.emit('error', { message: 'Unique ID is required' });
        socket.disconnect();
        return;
    }

    const connectionId = socket.id;

    // Join the room for this unique ID
    socket.join(uniqueId);

    const connection: SocketConnection = {
        socket,
        connectionId,
        uniqueId
    };

    // Add connection to in-memory map
    if (!connections.has(uniqueId)) {
        connections.set(uniqueId, []);
    }
    connections.get(uniqueId)!.push(connection);

    // Store connection in Redis
    await addConnectionToRedis(uniqueId, connectionId);

    console.log(`Connection ${connectionId} added to key: ${uniqueId}`);

    // Get room size using Socket.IO adapter
    const room = ioInstance.sockets.adapter.rooms.get(uniqueId);
    const roomSize = room?.size || 0;

    // Send connection confirmation with room size
    socket.emit('connected', {
        connectionId,
        uniqueId,
        message: 'Connected to room',
        connections: roomSize
    });

    // Handle broadcast messages
    socket.on('broadcast', async (data: any) => {
        try {
            // Normalize language to lowercase if present
            if (data.language && typeof data.language === 'string') {
                data.language = data.language.toLowerCase();
            }

            await broadcast(uniqueId, connectionId, data, ioInstance);
        } catch (error) {
            console.error('Error processing broadcast:', error);
            socket.emit('error', { 
                message: 'Failed to broadcast message',
                type: 'broadcast_error'
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        await removeConnection(uniqueId, connectionId);
        console.log(`Connection ${connectionId} removed from key: ${uniqueId}`);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
};

const setupSocketIOServer = (ioInstance: SocketIOServer) => {
    ioInstance.on('connection', (socket: Socket) => {
        handleSocketConnection(socket, ioInstance);
    });
};

// Public functions
export const initializeWebSocket = (server: HTTPServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    
    setupSocketIOServer(io);
    return io;
};

export const broadcast = async (uniqueId: string, senderConnectionId: string, data: any, ioInstance?: SocketIOServer) => {
    try {
        const ioToUse = ioInstance || io;
        if (!ioToUse) {
            console.error('Socket.IO server not initialized');
            return;
        }

        // Use socket.io rooms to broadcast to all sockets in the room except sender
        const senderSocket = ioToUse.sockets.sockets.get(senderConnectionId);
        
        if (senderSocket) {
            // Get room size using Socket.IO adapter (more accurate)
            const room = ioToUse.sockets.adapter.rooms.get(uniqueId);
            const roomSize = room?.size || 0;
            // Recipients count excludes the sender
            const recipients = Math.max(0, roomSize - 1);

            // Broadcast to room excluding sender
            senderSocket.to(uniqueId).emit('broadcast', {
                data,
                sender: senderConnectionId,
                timestamp: Date.now()
            });

            console.log(`Broadcast sent to ${recipients} connections for key: ${uniqueId}`);
            
            // Send confirmation to sender
            senderSocket.emit('broadcast_sent', {
                recipients: recipients,
                message: `Message broadcasted to ${recipients} connection(s)`
            });
        }
    } catch (error) {
        console.error('Error broadcasting message:', error);
    }
};

export const broadcastToKey = async (uniqueId: string, data: any) => {
    try {
        if (!io) {
            console.error('Socket.IO server not initialized');
            return 0;
        }

        // Normalize language to lowercase if present
        if (data.language && typeof data.language === 'string') {
            data.language = data.language.toLowerCase();
        }

        // Get room size using Socket.IO adapter
        const room = io.sockets.adapter.rooms.get(uniqueId);
        const sentCount = room?.size || 0;

        // Use socket.io rooms to broadcast to all sockets in the room
        io.to(uniqueId).emit('broadcast', {
            data,
            timestamp: Date.now()
        });

        console.log(`Broadcast sent to ${sentCount} connections for key: ${uniqueId}`);
        return sentCount;
    } catch (error) {
        console.error('Error broadcasting to key:', error);
        return 0;
    }
};

export const getConnectionsCount = (uniqueId: string): number => {
    // Use Socket.IO adapter for accurate room size
    if (io) {
        const room = io.sockets.adapter.rooms.get(uniqueId);
        return room?.size || 0;
    }
    // Fallback to in-memory map if io not initialized
    return connections.get(uniqueId)?.length || 0;
};

export const getIO = (): SocketIOServer | null => {
    return io;
};
