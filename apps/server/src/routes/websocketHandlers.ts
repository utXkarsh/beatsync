import {
  ClientActionEnum,
  WSBroadcastType,
  WSRequestSchema,
} from "@beatsync/shared";
import { Server, ServerWebSocket } from "bun";
import { roomManager } from "../store";
import { sendBroadcast, sendUnicast } from "../utils/responses";
import { WSData } from "../utils/websocket";

const createClientUpdate = (roomId: string) => {
  const message: WSBroadcastType = {
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
  sendBroadcast({ server, roomId, message });

  // TODO: Send unicast
};

export const handleMessage = async (
  ws: ServerWebSocket<WSData>,
  message: string | Buffer,
  server: Server
) => {
  const t1 = Date.now();
  const { roomId, username } = ws.data;

  try {
    const parsedData = JSON.parse(message.toString());
    const parsedMessage = WSRequestSchema.parse(parsedData);

    console.log(
      `Room: ${roomId} | User: ${username} | Message: ${JSON.stringify(
        parsedMessage
      )}`
    );

    // NTP Request
    if (parsedMessage.type === ClientActionEnum.enum.NTP_REQUEST) {
      sendUnicast({
        ws,
        message: {
          type: "NTP_RESPONSE",
          t0: parsedMessage.t0, // Echo back the client's t0
          t1, // Server receive time
          t2: Date.now(), // Server send time
        },
      });

      return;
    } else if (
      parsedMessage.type === ClientActionEnum.enum.PLAY ||
      parsedMessage.type === ClientActionEnum.enum.PAUSE
    ) {
      sendBroadcast({
        server,
        roomId,
        message: {
          type: "SCHEDULED_ACTION",
          scheduledAction: parsedMessage,
          serverTimeToExecute: Date.now() + 500, // 500 ms from now
          // TODO: Make the longest RTT + some amount instead of hardcoded this breaks for long RTTs > 500
        },
      });

      return;
    } else {
      console.log(`UNRECOGNIZED MESSAGE: ${JSON.stringify(parsedMessage)}`);
    }
  } catch (error) {
    console.error("Invalid message format:", error);
    ws.send(
      JSON.stringify({ type: "ERROR", message: "Invalid message format" })
    );
  }
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
