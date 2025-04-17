import {
  ClientType,
  GRID,
  PositionType,
  WSBroadcastType,
} from "@beatsync/shared";
import { Server, ServerWebSocket } from "bun";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import * as path from "path";
import {
  AUDIO_DIR,
  AUDIO_HIGH,
  AUDIO_LOW,
  SCHEDULE_TIME_MS,
  VOLUME_DOWN_RAMP_TIME,
  VOLUME_UP_RAMP_TIME,
} from "./config";
import { gainFromDistanceExp } from "./spatial";
import { sendBroadcast } from "./utils/responses";
import { debugClientPositions, positionClientsInCircle } from "./utils/spatial";
import { WSData } from "./utils/websocket";

interface RoomData {
  clients: Map<string, ClientType>;
  roomId: string;
  intervalId?: NodeJS.Timeout; // https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval
  listeningSource: PositionType;
}

class RoomManager {
  rooms = new Map<string, RoomData>();

  addClient(ws: ServerWebSocket<WSData>) {
    const { roomId, username, clientId } = ws.data;
    const room = this.rooms.get(roomId);
    if (!room) {
      this.rooms.set(roomId, {
        clients: new Map(),
        roomId,
        listeningSource: { x: GRID.ORIGIN_X, y: GRID.ORIGIN_Y }, // Center of the grid
      });
    }

    const currentRoom = this.rooms.get(roomId)!;

    // Add the new client
    currentRoom.clients.set(clientId, {
      username,
      clientId,
      ws,
      rtt: 0,
      position: { x: GRID.ORIGIN_X, y: GRID.ORIGIN_Y - 25 }, // Initial position at center
    });

    positionClientsInCircle(currentRoom.clients);
    debugClientPositions(currentRoom.clients);
  }

  removeClient(roomId: string, clientId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.delete(clientId);
    if (room.clients.size === 0) {
      this.stopInterval(roomId);
      this.cleanupRoomFiles(roomId);
      this.rooms.delete(roomId);
    }

    positionClientsInCircle(room.clients);
  }

  // Clean up room files when all clients have left
  async cleanupRoomFiles(roomId: string) {
    try {
      const roomDirPath = path.join(AUDIO_DIR, `room-${roomId}`);

      // Check if the directory exists before attempting to delete files
      // Using Node.js fs.existsSync instead of Bun.file().exists() for directories
      if (existsSync(roomDirPath)) {
        // List all files in the directory
        const files = await readdir(roomDirPath);

        console.log(
          `Found room directory for ${roomId}, cleaning up ${files.length} files...`
        );

        if (files.length > 0) {
          // Delete each file in the directory
          for (const file of files) {
            const filePath = path.join(roomDirPath, file);
            await Bun.file(filePath).delete();
          }

          // Remove the directory using rm -rf
          await Bun.spawn(["rmdir", roomDirPath]).exited;

          console.log(`Cleaned up audio files for room ${roomId}`);
        } else {
          console.log(`No audio files found in room directory ${roomId}`);
        }
      } else {
        console.log(`No audio directory found for room ${roomId}`);
      }
    } catch (error) {
      console.error(`Error cleaning up room files for ${roomId}:`, error);
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

    // Move the client to the end
    const [client] = clients.splice(clientIndex, 1);
    clients.push(client);

    // Update the clients map to maintain the new order
    room.clients.clear();
    clients.forEach((client) => {
      room.clients.set(client.clientId, client);
    });

    return clients;
  }

  // Method to update the RTT for a specific client
  updateClientRTT(roomId: string, clientId: string, rtt: number) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const client = room.clients.get(clientId);
    if (client) {
      client.rtt = rtt;
      room.clients.set(clientId, client);
    }
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
        serverTimeToExecute: Date.now() + SCHEDULE_TIME_MS, // Dynamic delay based on max RTT + 250ms
        scheduledAction: {
          type: "SPATIAL_CONFIG",
          listeningSource: room.listeningSource,
          gains: Object.fromEntries(
            clients.map((client, index) => {
              const isFocused = index === focusIndex;
              return [
                client.clientId,
                {
                  gain: isFocused ? AUDIO_HIGH : AUDIO_LOW,
                  rampTime: isFocused
                    ? VOLUME_UP_RAMP_TIME
                    : VOLUME_DOWN_RAMP_TIME,
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

  updateListeningSource({
    roomId,
    position,
    server,
  }: {
    roomId: string;
    position: PositionType;
    server: Server;
  }) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.listeningSource = position;

    // Calculate gains for each client based on distance from listening source
    const clients = Array.from(room.clients.values());

    const gains = Object.fromEntries(
      clients.map((client) => {
        const gain = gainFromDistanceExp({
          client: client.position,
          source: position,
        });

        console.log(
          `Client ${client.username} at (${client.position.x}, ${
            client.position.y
          }) - gain: ${gain.toFixed(2)}`
        );
        return [
          client.clientId,
          {
            gain,
            rampTime: 0.25, // Use a moderate ramp time for smooth transitions
          },
        ];
      })
    );

    // Send the updated gains to all clients
    sendBroadcast({
      server,
      roomId,
      message: {
        type: "SCHEDULED_ACTION",
        serverTimeToExecute: Date.now() + 0,
        scheduledAction: {
          type: "SPATIAL_CONFIG",
          listeningSource: room.listeningSource,
          gains,
        },
      },
    });
  }
}

export const roomManager = new RoomManager();
