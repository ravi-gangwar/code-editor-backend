import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '18058'),
    }
});

client.on('error', err => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));
client.on('ready', () => console.log('Redis Client Ready'));

// Connect to Redis
client.connect().catch(err => {
    console.error('Failed to connect to Redis:', err);
});

// Helper function to check if Redis is connected
export const isRedisConnected = () => {
    return client.isReady;
};

export default client;

