import { ExtractWSRequestFrom } from "@beatsync/shared";
import { globalManager } from "../../managers";
import { HandlerFunction } from "../types";

export const handleMoveClient: HandlerFunction<
  ExtractWSRequestFrom["MOVE_CLIENT"]
> = async ({ ws, message, server }) => {
  // Handle client move
  const room = globalManager.getRoom(ws.data.roomId);
  if (!room) return;

  room.moveClient(message.clientId, message.position, server);
};
