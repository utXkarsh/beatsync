import { ExtractWSRequestFrom } from "@beatsync/shared";
import { globalManager } from "../../managers";
import { HandlerFunction } from "../types";

export const handleSetListeningSource: HandlerFunction<
  ExtractWSRequestFrom["SET_LISTENING_SOURCE"]
> = async ({ ws, message, server }) => {
  // Handle listening source update
  const room = globalManager.getRoom(ws.data.roomId);
  if (!room) return;

  room.updateListeningSource(message, server);
};
