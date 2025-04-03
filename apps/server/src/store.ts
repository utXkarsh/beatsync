import { ClientType } from "@beatsync/shared";
import { WSData } from "./utils/websocket";

interface RoomData {
  clients: Map<string, ClientType>;
  roomId: string;
}

class RoomManager {
  rooms = new Map<string, RoomData>();

  addClient({ roomId, username, clientId }: WSData) {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.rooms.set(roomId, { clients: new Map(), roomId });
    }

    this.rooms.get(roomId)!.clients.set(clientId, { username, clientId });
  }

  removeClient(roomId: string, clientId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.delete(clientId);
    if (room.clients.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  getRoomState(roomId: string): RoomData | undefined {
    return this.rooms.get(roomId);
  }

  getClients(roomId: string): ClientType[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.clients.values());
  }
}

export const roomManager = new RoomManager();
