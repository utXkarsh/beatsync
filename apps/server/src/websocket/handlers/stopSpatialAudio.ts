import {
  ExtractWSRequestFrom,
  WSBroadcastType,
  epochNow,
} from "@beatsync/shared";
import { globalManager } from "../../managers";
import { sendBroadcast } from "../../utils/responses";
import { HandlerFunction } from "../types";

export const handleStopSpatialAudio: HandlerFunction<
  ExtractWSRequestFrom["STOP_SPATIAL_AUDIO"]
> = async ({ ws, message, server }) => {
  // This important for
  const broadcastMessage: WSBroadcastType = {
    type: "SCHEDULED_ACTION",
    scheduledAction: {
      type: "STOP_SPATIAL_AUDIO",
    },
    serverTimeToExecute: epochNow() + 0,
  };

  // Reset all gains:
  sendBroadcast({ server, roomId: ws.data.roomId, message: broadcastMessage });

  // Stop the spatial audio interval if it exists
  const room = globalManager.getRoom(ws.data.roomId);
  if (!room) return; // do nothing if no room exists

  room.stopSpatialAudio();
};
