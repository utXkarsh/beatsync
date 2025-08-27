import { Server, ServerWebSocket } from "bun";
import { WSData } from "../utils/websocket";
import { globalManager } from "../managers";
import { ExtractWSRequestFrom, ClientActionEnum } from "@beatsync/shared";

export const handleStartSpatialAudio = async ({
  ws,
  message,
  server,
}: {
  ws: ServerWebSocket<WSData>;
  message: ExtractWSRequestFrom[typeof ClientActionEnum.enum.START_SPATIAL_AUDIO];
  server: Server;
}) => {
  const { roomId } = ws.data;
  const room = globalManager.getRoom(roomId);
  if (!room) return;
  // Set the effect type if provided
  if (message.effectType) {
    room.setSpatialEffectType(message.effectType);
  }
  room.startSpatialAudio(server);
};
