import { sendBroadcast } from "../../utils/responses";
import { HandlerFunction } from "../types";
import { SongInfo } from "@beatsync/shared/types/room";
import { SetUserPlaybackType } from "@beatsync/shared/types/WSBroadcast";
import { globalManager } from "../../managers";

interface SetUserPlaybackMessage {
  roomId: string;
  clientId: string;
  song: SongInfo;
}

export const handleSetUserPlayback: HandlerFunction<
  SetUserPlaybackMessage
> = async ({ ws, message, server }) => {
  const { roomId, clientId, song } = message;
  const room = globalManager.getRoom(roomId);
  if (!room) return;
  room.setUserPlayback(clientId, song);

  // Broadcast updated per-user playback to all clients in the room
  if (room.getState().features.perUserPlaybackEnabled) {
    const broadcastMessage: SetUserPlaybackType = {
      type: "SET_USER_PLAYBACK",
      userPlayback: room.getUserPlayback(),
    };
    sendBroadcast({
      server,
      roomId,
      message: {
        type: "ROOM_EVENT",
        event: broadcastMessage,
      },
    });
  }
};
