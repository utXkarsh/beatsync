import { ServerWebSocket } from "bun";
import { globalManager, RoomManager } from "../managers";
import { WSData } from "../utils/websocket";

export const requireRoom = (
  ws: ServerWebSocket<WSData>
): { room: RoomManager } => {
  if (!ws.data.roomId) {
    throw new Error(
      "WebSocket connection missing roomId - client not properly joined to a room"
    );
  }

  const room = globalManager.getRoom(ws.data.roomId);

  if (!room) {
    throw new Error(
      `Room ${ws.data.roomId} not found in global manager - room may have been cleaned up or never existed`
    );
  }

  return { room };
};
