import { ServerWebSocket } from "bun";
import { globalManager, RoomManager } from "../managers";
import { WSData } from "../utils/websocket";

export const requireRoom = (
  ws: ServerWebSocket<WSData>
): { room: RoomManager } => {
  if (!ws.data.roomId) {
    throw new Error("Room not found");
  }

  const room = globalManager.getRoom(ws.data.roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  return { room };
};
