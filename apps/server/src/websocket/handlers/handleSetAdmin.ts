import { ExtractWSRequestFrom } from "@beatsync/shared";
import { requireRoomAdmin } from "../middlewares";
import { HandlerFunction } from "../types";

export const handleSetAdmin: HandlerFunction<
  ExtractWSRequestFrom["SET_ADMIN"]
> = async ({ ws, message }) => {
  const { room } = requireRoomAdmin(ws);
  room.setAdmin({
    targetClientId: message.clientId,
    isAdmin: message.isAdmin,
  });
};
