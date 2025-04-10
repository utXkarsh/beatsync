import { ClientType, WSBroadcastType } from "@beatsync/shared";
import { Server, ServerWebSocket } from "bun";
import { sendBroadcast } from "./utils/responses";
import { WSData } from "./utils/websocket";

interface RoomData {
  clients: Map<string, ClientType>;
  roomId: string;
  intervalId?: NodeJS.Timeout; // https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval
}

const AUDIO_LOW = 0.15;
const AUDIO_HIGH = 1.0;
const volumeUpRampTime = 0.5;
const volumeDownRampTime = 0.5;

class RoomManager {
  rooms = new Map<string, RoomData>();

  addClient(ws: ServerWebSocket<WSData>) {
    const { roomId, username, clientId } = ws.data;
    const room = this.rooms.get(roomId);
    if (!room) {
      this.rooms.set(roomId, { clients: new Map(), roomId });
    }

    this.rooms.get(roomId)!.clients.set(clientId, { username, clientId, ws });
  }

  removeClient(roomId: string, clientId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.delete(clientId);
    if (room.clients.size === 0) {
      this.stopInterval(roomId);
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

  reorderClients(roomId: string, clientId: string): ClientType[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const clients = Array.from(room.clients.values());
    const clientIndex = clients.findIndex(
      (client) => client.clientId === clientId
    );

    if (clientIndex === -1) return clients; // Client not found

    // Move the client to the front
    const [client] = clients.splice(clientIndex, 1);
    clients.unshift(client);

    return clients;
  }

  startInterval({ server, roomId }: { server: Server; roomId: string }) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Create a closure for the focus index that persists between startInterval calls
    let focusIndex = 0;
    // And one for the number of loops
    let loopCount = 0;

    const updateSpatialAudio = () => {
      const clients = Array.from(room.clients.values()); // get most recent
      console.log(
        `ROOM ${roomId} LOOP ${loopCount}: Current focus index: ${focusIndex}, Connected clients: ${clients.length}`
      );
      if (clients.length === 0) return;

      // Move focus to next client, wrap around if needed
      focusIndex = (focusIndex + 1) % clients.length;

      // Set gain for each client - focused client gets AUDIO_HIGH, others get AUDIO_LOW
      const message: WSBroadcastType = {
        type: "SCHEDULED_ACTION",
        serverTimeToExecute: Date.now() + 500,
        scheduledAction: {
          type: "SPATIAL_CONFIG",
          gains: Object.fromEntries(
            clients.map((client, index) => {
              const isFocused = index === focusIndex;
              return [
                client.clientId,
                {
                  gain: isFocused ? AUDIO_HIGH : AUDIO_LOW,
                  rampTime: isFocused ? volumeUpRampTime : volumeDownRampTime,
                },
              ];
            })
          ),
        },
      };

      sendBroadcast({ server, roomId, message });
      loopCount++;
    };

    room.intervalId = setInterval(updateSpatialAudio, 1000);
  }

  stopInterval(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    clearInterval(room.intervalId);
    room.intervalId = undefined;
  }
}

export const roomManager = new RoomManager();
