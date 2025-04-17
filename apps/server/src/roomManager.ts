import {
  ClientType,
  GRID,
  PositionType,
  WSBroadcastType,
} from "@beatsync/shared";
import { Server, ServerWebSocket } from "bun";
import { gainFromDistanceExp } from "./spatial";
import { sendBroadcast } from "./utils/responses";
import { debugClientPositions, positionClientsInCircle } from "./utils/spatial";
import { WSData } from "./utils/websocket";

export const SCHEDULE_TIME_MS = 750;

interface RoomData {
  clients: Map<string, ClientType>;
  roomId: string;
  intervalId?: NodeJS.Timeout; // https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval
  listeningSource: PositionType;
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
      this.rooms.delete(roomId);
    }

    positionClientsInCircle(room.clients);
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
