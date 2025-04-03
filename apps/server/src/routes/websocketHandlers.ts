import {
  ClientActionEnum,
  NTPRequestMessage,
  WSResponse,
} from "@beatsync/shared";
import { Server, ServerWebSocket } from "bun";
import { roomManager } from "../store";
import { deserializeMessage, WSData } from "../utils/websocket";

const createClientUpdate = (roomId: string) => {
  const message: WSResponse = {
    type: "ROOM_EVENT",
    event: {
      type: ClientActionEnum.Enum.CLIENT_CHANGE,
      clients: roomManager.getClients(roomId),
    },
  };
  return message;
};

export const handleOpen = (ws: ServerWebSocket<WSData>, server: Server) => {
  console.log(
    `WebSocket connection opened for user ${ws.data.username} in room ${ws.data.roomId}`
  );

  const { roomId } = ws.data;
  ws.subscribe(roomId);

  roomManager.addClient(ws.data);

  const message = createClientUpdate(roomId);
  server.publish(roomId, JSON.stringify(message));
};

export const handleMessage = async (
  ws: ServerWebSocket<WSData>,
  message: string | Buffer,
  server: Server
) => {
  const { roomId, clientId: userId, username } = ws.data;
  const t1 = Date.now();
  const parsedMessage = deserializeMessage(message.toString());
  console.log(
    `Room: ${roomId} | User: ${username} | Message: ${JSON.stringify(
      parsedMessage
    )}`
  );

  // NTP Request
  if (parsedMessage.type === ClientActionEnum.Enum.NTP_REQUEST) {
    const ntpRequest = parsedMessage as NTPRequestMessage;
    const ntpResponse: WSResponse = {
      type: "NTP_RESPONSE",
      t0: ntpRequest.t0, // Echo back the client's t0
      t1, // Server receive time
      t2: Date.now(), // Server send time
    };

    ws.send(JSON.stringify(ntpResponse));
    return;
  } else if (
    parsedMessage.type === ClientActionEnum.enum.PLAY ||
    parsedMessage.type === ClientActionEnum.enum.PAUSE
  ) {
    const scheduledMessage: WSResponse = {
      type: "SCHEDULED_ACTION",
      scheduledAction: parsedMessage,
      timeToExecute: Date.now() + 500, // 500 ms from now
    };
    console.log("Publishing message for room", roomId);
    server.publish(roomId, JSON.stringify(scheduledMessage));
    return;
  }

  // Others are just events
  const event: WSResponse = {
    type: "ROOM_EVENT",
    event: parsedMessage,
  };

  server.publish(roomId, JSON.stringify(event));
};

export const handleClose = (ws: ServerWebSocket<WSData>, server: Server) => {
  console.log(
    `WebSocket connection closed for user ${ws.data.username} in room ${ws.data.roomId}`
  );
  ws.unsubscribe(ws.data.roomId);

  roomManager.removeClient(ws.data.roomId, ws.data.clientId);

  const message = createClientUpdate(ws.data.roomId);
  server.publish(ws.data.roomId, JSON.stringify(message));
};
