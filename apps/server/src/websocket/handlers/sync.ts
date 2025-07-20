import { ExtractWSRequestFrom } from "@beatsync/shared";
import { globalManager } from "../../managers";
import { HandlerFunction } from "../types";

export const handleSync: HandlerFunction<
  ExtractWSRequestFrom["SYNC"]
> = async ({ ws }) => {
  // Handle sync request from new client
  const room = globalManager.getRoom(ws.data.roomId);
  if (!room) return;
  room.syncClient(ws);
};
