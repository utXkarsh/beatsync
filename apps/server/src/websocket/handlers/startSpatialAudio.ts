import { ExtractWSRequestFrom } from "@beatsync/shared";
import { globalManager } from "../../managers";
import { HandlerFunction } from "../types";

export const handleStartSpatialAudio: HandlerFunction<
  ExtractWSRequestFrom["START_SPATIAL_AUDIO"]
> = async ({ ws, message, server }) => {
  // Start loop only if not already started
  const room = globalManager.getRoom(ws.data.roomId);
  if (!room) return; // do nothing if no room exists

  room.startSpatialAudio(server);
};
