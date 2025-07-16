import { jsonResponse, errorResponse } from "../utils/responses";
import { globalManager } from "../managers/GlobalManager";
import { GetActiveRoomsType } from "@beatsync/shared";

export async function getActiveRooms(_req: Request) {
  const rooms = globalManager.getRooms();

  const response: GetActiveRoomsType = rooms.reduce(
    (acc, [_, room]) => acc + room.getNumClients(),
    0
  );
  return jsonResponse(response);
}
