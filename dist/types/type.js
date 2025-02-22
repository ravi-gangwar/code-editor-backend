"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventName = void 0;
var EventName;
(function (EventName) {
    EventName["JoinRoom"] = "join-room";
    EventName["LeaveRoom"] = "leave-room";
    EventName["SendMessage"] = "send-message";
    EventName["CreateRoom"] = "create-room";
    EventName["ReceivedMessage"] = "received-message";
    EventName["Error"] = "error";
    EventName["Execution"] = "execution";
    EventName["Submission"] = "submission";
    EventName["SetLanguage"] = "set-language";
    EventName["SetOutput"] = "set-output";
})(EventName || (exports.EventName = EventName = {}));
