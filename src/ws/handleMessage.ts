import { EventName } from "../types/type";
import { WebSocket } from 'ws';
import { joinRoom, leaveRoom, sendMessage, setLanguage, setOutput } from "./wsActions";

const handleMessage = (message: string, ws: WebSocket) => {
    const data = JSON.parse(message);
    switch (data.eventName) {
        case EventName.JoinRoom:
            joinRoom(data.roomId, ws);
            break;
        case EventName.LeaveRoom:
            leaveRoom(data.roomId, ws);
            break;
        case EventName.SendMessage:
            sendMessage(data.message, data.roomId, ws);
            break;
        case EventName.SetLanguage:
            setLanguage(data.language, data.roomId, ws);
            break;
        case EventName.SetOutput:
            setOutput(data.output, data.roomId, ws);
            break;
        default:
            ws.send(JSON.stringify({        
                eventName: EventName.Error,
                message: "Invalid event name",
            }));
            break;
    }
}

export default handleMessage;