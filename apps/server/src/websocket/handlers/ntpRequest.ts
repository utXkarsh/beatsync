import { epochNow, ExtractWSRequestFrom } from "@beatsync/shared";
import { globalManager } from "../../managers";
import { sendUnicast } from "../../utils/responses";
import { HandlerFunction } from "../types";

export const handleNTPRequest: HandlerFunction<
  ExtractWSRequestFrom["NTP_REQUEST"]
> = async ({ ws, message }) => {
  if (!message.t1) {
    console.error("NTP request received without t1 timestamp");
    return;
  }

  // Update heartbeat for client
  const room = globalManager.getRoom(ws.data.roomId);
  if (!room) return;
  room.processNTPRequestFrom(ws.data.clientId);

  sendUnicast({
    ws,
    message: {
      type: "NTP_RESPONSE",
      t0: message.t0, // Echo back the client's t0
      t1: message.t1, // Server receive time
      t2: epochNow(), // Server send time
    },
  });
};
