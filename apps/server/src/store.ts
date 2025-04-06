import { ClientType } from "@beatsync/shared";
import { ServerWebSocket } from "bun";
import { sendUnicast } from "./utils/responses";
import { WSData } from "./utils/websocket";

interface RoomData {
  clients: Map<string, ClientType>;
  roomId: string;
  intervalId?: NodeJS.Timeout; // https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval
}

const AUDIO_LOW = 0.2;
const AUDIO_HIGH = 1.0;
const volumeUpRampTime = 0.5;
const volumeDownRampTime = 1.2;

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

  startInterval(roomId: string) {
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

      // Set gain for each client - focused client gets 1.0, others get 0.5
      clients.forEach((client, index) => {
        if (clients.length === 1) {
          sendUnicast({
            ws: client.ws,
            message: {
              type: "SET_GAIN",
              gain: loopCount % 2 === 0 ? AUDIO_HIGH : AUDIO_LOW,
              rampTime:
                loopCount % 2 === 0 ? volumeUpRampTime : volumeDownRampTime,
            },
          });
        } else {
          // Normal case, multiple clients
          const isVolumeGoingUp = index === focusIndex;
          const gain = isVolumeGoingUp ? AUDIO_HIGH : AUDIO_LOW;
          const rampTime = isVolumeGoingUp
            ? volumeUpRampTime
            : volumeDownRampTime;

          sendUnicast({
            ws: client.ws,
            message: {
              type: "SET_GAIN",
              gain,
              rampTime,
            },
          });
        }
      });

      loopCount++;
    };

    // Change every two seconds
    room.intervalId = setInterval(updateSpatialAudio, 2000);
  }

  stopInterval(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    clearInterval(room.intervalId);
    room.intervalId = undefined;
  }
}

export const roomManager = new RoomManager();
