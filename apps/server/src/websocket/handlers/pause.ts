import { epochNow, ExtractWSRequestFrom } from "@beatsync/shared";
import { SCHEDULE_TIME_MS } from "../../config";
import { globalManager } from "../../managers";
import { sendBroadcast } from "../../utils/responses";
import { HandlerFunction } from "../types";

export const handlePause: HandlerFunction<
  ExtractWSRequestFrom["PAUSE"]
> = async ({ ws, message, server }) => {
  const room = globalManager.getRoom(ws.data.roomId);
  if (!room) return;

  const serverTimeToExecute = epochNow() + SCHEDULE_TIME_MS;

  // Update playback state
  room.updatePlaybackSchedulePause(message, serverTimeToExecute);

  sendBroadcast({
    server,
    roomId: ws.data.roomId,
    message: {
      type: "SCHEDULED_ACTION",
      scheduledAction: message,
      serverTimeToExecute: serverTimeToExecute,
      // TODO: Make the longest RTT + some amount instead of hardcoded this breaks for long RTTs
    },
  });
};
