import { EventName } from "../types/type";
import { WebSocket } from 'ws';

type wsState = {
    rooms: {
        [key: string]: {
            clients: WebSocket[];
            content: string;
            language: string;
            output: string;
        };
    };
}

const wsState: wsState = {
    rooms: {},
}

export const joinRoom = (roomId: string, ws: WebSocket) => {
    const state = ws.readyState;
    if (state !== WebSocket.OPEN) {
        ws.send(JSON.stringify({
            eventName: EventName.Error,
            message: "WebSocket is not open",
        }));
        return;
    }
    const room = wsState.rooms[roomId];
    if (!room) {
        wsState.rooms[roomId] = {
            clients: [],
            content: "",
            language: "",
            output: "",
        };
    }
    wsState.rooms[roomId].clients.push(ws);
    ws.send(JSON.stringify({
        eventName: EventName.JoinRoom,
        roomId: roomId,
    }))
}

export const leaveRoom = (roomId: string, ws: WebSocket) => {
    const room = wsState.rooms[roomId];
    if (!room) {
        ws.send(JSON.stringify({
            eventName: EventName.Error,
            message: "Room not found",
        }));
        return;
    }
    room.clients = room.clients.filter(client => client !== ws);
    ws.send(JSON.stringify({
        eventName: EventName.LeaveRoom,
        roomId: roomId,
    }))
}

export const sendMessage = (message: string, roomId: string, ws: WebSocket) => {
    const room = wsState.rooms[roomId];
    if(room.clients.length === 1) return;
    if (!room) {
        ws.send(JSON.stringify({
            eventName: EventName.Error,
            message: "Room not found",
        }));
        return;
    }
    room.content = message;
    room.clients.forEach(client => {
        if(client !== ws){
            client.send(JSON.stringify({
                eventName: EventName.ReceivedMessage,
                message: {
                    language: room.language,
                    content: message,
                    roomId: roomId,
                },
            }))
        } 
    })
}

export const setLanguage = (language: string, roomId: string, ws: WebSocket) => {
    const room = wsState.rooms[roomId];
    if(room.clients.length === 1) return;
    if (!room) {
        ws.send(JSON.stringify({
            eventName: EventName.Error,
            message: "Room not found",
        }));
        return;
    }
    room.language = language;
    room.clients.forEach(client => {
        if(client !== ws) {
            client.send(JSON.stringify({
                eventName: EventName.SetLanguage,
                message: {
                    language: language,
                    roomId: roomId,
                },
            }))
        }
    })
}


export const setOutput = (output: string, roomId: string, ws: WebSocket) => {
    const room = wsState.rooms[roomId];
    if(room.clients.length === 1) return;
    if (!room) {
        ws.send(JSON.stringify({
            eventName: EventName.Error,
            message: "Room not found",
        }));
        return;
    }
    room.output = output;
    room.clients.forEach(client => {
        if(client !== ws){
            client.send(JSON.stringify({
                eventName: EventName.SetOutput,
                message: {
                    output: output,
                    roomId: roomId,
                },
            }))
        }
    })
}