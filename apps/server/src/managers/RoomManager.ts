//This is the heart of the server-side logic. It manages the state of each room, including the positions of clients and the listening source. The startSpatialAudio method is particularly important. It sets up an interval that periodically updates the listening source's position to create a moving effect (either a rotation or an "infinity" loop). It then calculates the gain for each client and broadcasts the updated spatial configuration to all clients in the room.

import {
  AudioSourceType,
  ClientType,
  epochNow,
  NTP_CONSTANTS,
  PauseActionType,
  PlayActionType,
  PlaybackControlsPermissionsEnum,
  PlaybackControlsPermissionsType,
  PositionType,
  RoomType,
  WSBroadcastType,
} from "@beatsync/shared";
import { AudioSourceSchema, GRID } from "@beatsync/shared/types/basic";
import {
  RoomFeatures,
  SongInfo,
  UserPlayback,
} from "@beatsync/shared/types/room";
import { SendLocationSchema } from "@beatsync/shared/types/WSRequest";
import { Server, ServerWebSocket } from "bun";
import { z } from "zod";
import { SCHEDULE_TIME_MS } from "../config";
import { deleteObjectsWithPrefix } from "../lib/r2";
import { calculateGainFromDistanceToSource } from "../spatial";
import { sendBroadcast, sendUnicast } from "../utils/responses";
import { positionClientsInCircle } from "../utils/spatial";
import { WSData } from "../utils/websocket";

interface RoomData {
  audioSources: AudioSourceType[];
  clients: Map<string, ClientType>;
  roomId: string;
  intervalId?: NodeJS.Timeout;
  listeningSource: PositionType;
  playbackControlsPermissions: PlaybackControlsPermissionsType;
  features: RoomFeatures;
  userPlayback: UserPlayback;
}

// Define Zod schemas for backup validation
const BackupClientSchema = z.object({
  clientId: z.string(),
  username: z.string(),
  isAdmin: z.boolean(),
});

export const ClientCacheBackupSchema = z.record(
  z.string(),
  z.object({ isAdmin: z.boolean() }),
);

const RoomBackupSchema = z.object({
  clients: z.array(BackupClientSchema),
  audioSources: z.array(AudioSourceSchema),
  clientCache: ClientCacheBackupSchema.optional(),
});
export type RoomBackupType = z.infer<typeof RoomBackupSchema>;

export const ServerBackupSchema = z.object({
  timestamp: z.number(),
  data: z.object({
    rooms: z.record(z.string(), RoomBackupSchema),
  }),
});
export type ServerBackupType = z.infer<typeof ServerBackupSchema>;

const RoomPlaybackStateSchema = z.object({
  type: z.enum(["playing", "paused"]),
  audioSource: z.string(), // URL of the audio source
  serverTimeToExecute: z.number(), // When playback started/paused (server time)
  trackPositionSeconds: z.number(), // Position in track when started/paused (seconds)
});
type RoomPlaybackState = z.infer<typeof RoomPlaybackStateSchema>;

/**
 * RoomManager handles all operations for a single room.
 * Each room has its own instance of RoomManager.
 */
export class RoomManager {
  private clients = new Map<string, ClientType>();
  private clientCache = new Map<string, Pick<ClientType, "isAdmin">>(); // user id -> isAdmin
  private audioSources: AudioSourceType[] = [];
  private listeningSource: PositionType = {
    x: GRID.ORIGIN_X,
    y: GRID.ORIGIN_Y,
  };
  // New feature flag and per-user playback mapping
  private features: RoomFeatures = { perUserPlaybackEnabled: false };
  private userPlayback: UserPlayback = {};
  private intervalId?: NodeJS.Timeout;
  private spatialEffectType: "rotation" | "infinity" | "aisle_sweep" = "rotation";
  private spatialEffectSpeed = 1.0;
    "rotation";
  /**
   * Set the spatial audio effect type (rotation, infinity, aisle_sweep, etc.)
   */
  setSpatialEffectType(
    effectType: "rotation" | "infinity" | "aisle_sweep",
    speed?: number,
  ) {
    this.spatialEffectType = effectType;
    if (speed) {
      this.spatialEffectSpeed = speed;
    }
  }
  private cleanupTimer?: NodeJS.Timeout;
  private heartbeatCheckInterval?: NodeJS.Timeout;
  private onClientCountChange?: () => void;
  private playbackState: RoomPlaybackState = {
    type: "paused",
    audioSource: "",
    serverTimeToExecute: 0,
    trackPositionSeconds: 0,
  };
  private playbackControlsPermissions: PlaybackControlsPermissionsType =
    "ADMIN_ONLY";
  private activeStreamJobs = new Map<
    string,
    { trackId: string; status: string }
  >();

  constructor(
    private readonly roomId: string,
    onClientCountChange?: () => void, // To update the global # of clients active
  ) {
    this.onClientCountChange = onClientCountChange;
    // features and userPlayback already initialized above
  }
  getRoomId(): string {
    return this.roomId;
  }

  getPlaybackControlsPermissions(): PlaybackControlsPermissionsType {
    return this.playbackControlsPermissions;
  }

  /**
   * Add a client to the room
   */
  addClient(ws: ServerWebSocket<WSData>): void {
    // Cancel any pending cleanup since room is active again
    this.cancelCleanup();

    const { username, clientId } = ws.data;

    // Check if this username has cached admin status
    const cachedClient = this.clientCache.get(clientId);

    // The first client to join a room will always be an admin, otherwise they are an admin if they were an admin in the past
    const isAdmin = cachedClient?.isAdmin || this.clients.size === 0;

    // Update the client cache
    this.clientCache.set(clientId, { isAdmin });

    // Add the new client
    this.clients.set(clientId, {
      username,
      clientId,
      ws,
      isAdmin,
      rtt: 0,
      position: { x: GRID.ORIGIN_X, y: GRID.ORIGIN_Y - 25 }, // Initial position at center
      lastNtpResponse: Date.now(), // Initialize last NTP response time
    });
    // Initialize per-user playback for this user if feature is enabled
    if (this.features.perUserPlaybackEnabled && !this.userPlayback[clientId]) {
      this.userPlayback[clientId] = {
        songId: "",
        url: "",
        title: "",
      };
    }

    positionClientsInCircle(this.clients);

    // Idempotently start heartbeat checking
    this.startHeartbeatChecking();

    // Notify that client count changed
    this.onClientCountChange?.();
  }

  /**
   * Remove a client from the room
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);

    // Reposition remaining clients if any
    if (this.clients.size > 0) {
      positionClientsInCircle(this.clients);

      // Always check to ensure there is at least one admin

      // Check if any admins remain after removing this client
      const remainingAdmins = Array.from(this.clients.values()).filter(
        (client) => client.isAdmin,
      );

      // If no admins remain, randomly select a new admin
      if (remainingAdmins.length === 0) {
        const remainingClients = Array.from(this.clients.values());
        const randomIndex = Math.floor(Math.random() * remainingClients.length);
        const newAdmin = remainingClients[randomIndex];

        if (newAdmin) {
          newAdmin.isAdmin = true;
          this.clients.set(newAdmin.clientId, newAdmin);
          this.clientCache.set(newAdmin.clientId, { isAdmin: true });

          console.log(
            `✨ Automatically promoted ${newAdmin.username} (${newAdmin.clientId}) to admin in room ${this.roomId}`,
          );
        }
      }
    } else {
      // Stop heartbeat checking if no clients remain
      this.stopHeartbeatChecking();
    }

    // Remove per-user playback mapping for this user
    if (this.userPlayback[clientId]) {
      delete this.userPlayback[clientId];
    }
    // Notify that client count changed
    this.onClientCountChange?.();
  }

  // Set per-user playback (song selection)
  setUserPlayback(clientId: string, song: SongInfo): void {
    if (!this.features.perUserPlaybackEnabled) return;
    this.userPlayback[clientId] = song;
  }

  // Get per-user playback mapping
  getUserPlayback(): UserPlayback {
    return this.userPlayback;
  }

  // Enable/disable per-user playback feature
  setPerUserPlaybackEnabled(enabled: boolean): void {
    this.features.perUserPlaybackEnabled = enabled;
    if (!enabled) {
      // Clear all per-user playback if disabling
      this.userPlayback = {};
    }
  }

  setAdmin({
    targetClientId,
    isAdmin,
  }: {
    targetClientId: string;
    isAdmin: boolean;
  }): void {
    const client = this.clients.get(targetClientId);
    if (!client) return;
    client.isAdmin = isAdmin;
    this.clients.set(targetClientId, client);

    // Update the client cache to remember this admin status
    this.clientCache.set(client.clientId, { isAdmin });
  }

  setPlaybackControls(
    permissions: z.infer<typeof PlaybackControlsPermissionsEnum>,
  ): void {
    this.playbackControlsPermissions = permissions;
  }

  /**
   * Add an audio source to the room
   */
  addAudioSource(source: AudioSourceType): AudioSourceType[] {
    this.audioSources.push(source);
    return this.audioSources;
  }

  // Set all audio sources (used in backup restoration)
  setAudioSources(sources: AudioSourceType[]): AudioSourceType[] {
    this.audioSources = sources;
    return this.audioSources;
  }

  // Restore client cache from backup
  restoreClientCache(cache: z.infer<typeof ClientCacheBackupSchema>): void {
    this.clientCache = new Map(Object.entries(cache));
  }

  /**
   * Get all clients in the room
   */
  getClients(): ClientType[] {
    return Array.from(this.clients.values());
  }

  /**
   * Check if the room is empty
   */
  isEmpty(): boolean {
    return this.clients.size === 0;
  }

  /**
   * Check if the room has any active clients based on recent NTP heartbeats
   * This is more reliable than checking WebSocket readyState which can be inconsistent
   */
  hasActiveConnections(): boolean {
    const now = Date.now();
    const clients = Array.from(this.clients.values());

    for (const client of clients) {
      // A client is considered active if they've sent an NTP request within the timeout window
      // This is more reliable than WebSocket readyState during network fluctuations
      const timeSinceLastResponse = now - client.lastNtpResponse;
      if (timeSinceLastResponse <= NTP_CONSTANTS.RESPONSE_TIMEOUT_MS) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the room state
   */
  getState(): RoomData {
    return {
      audioSources: this.audioSources,
      clients: this.clients,
      roomId: this.roomId,
      intervalId: this.intervalId,
      listeningSource: this.listeningSource,
      playbackControlsPermissions: this.playbackControlsPermissions,
      features: this.features,
      userPlayback: this.userPlayback,
    };
  }

  /**
   * Get room statistics
   */
  getStats(): RoomType {
    return {
      roomId: this.roomId,
      clientCount: this.clients.size,
      audioSourceCount: this.audioSources.length,
      hasSpatialAudio: !!this.intervalId,
    };
  }

  getNumClients(): number {
    return this.clients.size;
  }

  /**
   * Stream job management methods
   */
  addStreamJob(jobId: string, trackId: string): void {
    this.activeStreamJobs.set(jobId, { trackId, status: "active" });
  }

  removeStreamJob(jobId: string): void {
    this.activeStreamJobs.delete(jobId);
  }

  getActiveStreamJobCount(): number {
    return this.activeStreamJobs.size;
  }

  /**
   * Receive an NTP request from a client
   */
  processNTPRequestFrom(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    client.lastNtpResponse = Date.now();
    this.clients.set(clientId, client);
  }

  /**
   * Reorder clients, moving the specified client to the front
   */
  reorderClients(clientId: string, server: Server): ClientType[] {
    const clients = Array.from(this.clients.values());
    const clientIndex = clients.findIndex(
      (client) => client.clientId === clientId,
    );

    if (clientIndex === -1) return clients; // Client not found

    // Move the client to the front
    const [client] = clients.splice(clientIndex, 1);
    clients.unshift(client);

    // Update the clients map to maintain the new order
    this.clients.clear();
    clients.forEach((client) => {
      this.clients.set(client.clientId, client);
    });

    // Update client positions based on new order
    positionClientsInCircle(this.clients);

    // Update gains
    this._calculateGainsAndBroadcast(server);

    return clients;
  }

  /**
   * Move a client to a new position
   */
  moveClient(clientId: string, position: PositionType, server: Server): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.position = position;
    this.clients.set(clientId, client);

    // Update spatial audio config
    this._calculateGainsAndBroadcast(server);
  }

  /**
   * Update the listening source position
   */
  updateListeningSource(position: PositionType, server: Server): void {
    this.listeningSource = position;
    this._calculateGainsAndBroadcast(server);
  }

  /**
   * Start spatial audio interval
   */
  startSpatialAudio(server: Server): void {
    // Don't start if already running
    if (this.intervalId) return;

    let loopCount = 0;

    const updateSpatialAudio = () => {
      const clients = Array.from(this.clients.values());
      if (clients.length === 0) return;

      const radius = 25;
      const centerX = GRID.ORIGIN_X;
      const centerY = GRID.ORIGIN_Y;
      let newX = centerX;
      let newY = centerY;

      if (this.spatialEffectType === "rotation") {
        // Circular rotation
        const angle = (loopCount * Math.PI * this.spatialEffectSpeed) / 30;
        newX = centerX + radius * Math.cos(angle);
        newY = centerY + radius * Math.sin(angle);
      } else if (this.spatialEffectType === "infinity") {
        // Figure-eight using a Lissajous curve (more intuitive infinity symbol)
        // x = width * sin(t)
        // y = height * sin(2t)
        const angle =
          (loopCount * Math.PI * this.spatialEffectSpeed) / 60; // Slower speed for a full 2*PI loop over ~12 seconds
        const width = radius * 1.5; // Make the loop wider than it is tall
        const height = radius;

        newX = centerX + width * Math.sin(angle);
        newY = centerY + height * Math.sin(2 * angle); // The key is the 2* multiplier for the 'y' component
      } else if (this.spatialEffectType === "aisle_sweep") {
        // Linear sweep from left to right, then reset
        const sweepDuration = 200 / this.spatialEffectSpeed; // loop counts to complete a sweep
        const progress = (loopCount % sweepDuration) / sweepDuration;
        newX = progress * GRID.SIZE;
        newY = GRID.ORIGIN_Y;
      }

      this.listeningSource = { x: newX, y: newY };

      const gains = Object.fromEntries(
        clients.map((client) => {
          const gain = calculateGainFromDistanceToSource({
            client: client.position,
            source: this.listeningSource,
          });
          return [
            client.clientId,
            {
              gain,
              rampTime: 0.25,
            },
          ];
        }),
      );

      const message: WSBroadcastType = {
        type: "SCHEDULED_ACTION",
        serverTimeToExecute: epochNow() + SCHEDULE_TIME_MS,
        scheduledAction: {
          type: "SPATIAL_CONFIG",
          listeningSource: this.listeningSource,
          gains,
        },
      };

      sendBroadcast({ server, roomId: this.roomId, message });
      loopCount++;
    };

    this.intervalId = setInterval(updateSpatialAudio, 100);
  }

  /**
   * Stop spatial audio interval
   */
  stopSpatialAudio(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  updatePlaybackSchedulePause(
    pauseSchema: PauseActionType,
    serverTimeToExecute: number,
  ) {
    this.playbackState = {
      type: "paused",
      audioSource: pauseSchema.audioSource,
      trackPositionSeconds: pauseSchema.trackTimeSeconds,
      serverTimeToExecute: serverTimeToExecute,
    };
  }

  updatePlaybackSchedulePlay(
    playSchema: PlayActionType,
    serverTimeToExecute: number,
  ) {
    this.playbackState = {
      type: "playing",
      audioSource: playSchema.audioSource,
      trackPositionSeconds: playSchema.trackTimeSeconds,
      serverTimeToExecute: serverTimeToExecute,
    };
  }

  syncClient(ws: ServerWebSocket<WSData>): void {
    // A client has joined late, and needs to sync with the room
    // Predict where the playback state will be in epochNow() + SCHEDULE_TIME_MS
    // And make client play at that position then

    // Determine if we are currently playing or paused
    if (this.playbackState.type === "paused") {
      return; // Nothing to do - client will play on next scheduled action
    }

    const serverTimeWhenPlaybackStarted =
      this.playbackState.serverTimeToExecute;
    const trackPositionSecondsWhenPlaybackStarted =
      this.playbackState.trackPositionSeconds;
    const now = epochNow();
    const serverTimeToExecute = now + SCHEDULE_TIME_MS;

    // Calculate how much time has elapsed since playback started
    const timeElapsedSincePlaybackStarted = now - serverTimeWhenPlaybackStarted;

    // Calculate how much time will have elapsed by the time the client responds
    // to the sync response
    const timeElapsedAtExecution =
      serverTimeToExecute - serverTimeWhenPlaybackStarted;

    // Convert to seconds and add to the starting position
    const resumeTrackTimeSeconds =
      trackPositionSecondsWhenPlaybackStarted + timeElapsedAtExecution / 1000;
    console.log(
      `Syncing late client: track started at ${trackPositionSecondsWhenPlaybackStarted.toFixed(
        2,
      )}s, ` +
        `${(timeElapsedSincePlaybackStarted / 1000).toFixed(2)}s elapsed, ` +
        `will be at ${resumeTrackTimeSeconds.toFixed(2)}s when client starts`,
    );

    sendUnicast({
      ws,
      message: {
        type: "SCHEDULED_ACTION",
        scheduledAction: {
          type: "PLAY",
          audioSource: this.playbackState.audioSource,
          trackTimeSeconds: resumeTrackTimeSeconds, // Use the calculated position
        },
        serverTimeToExecute: serverTimeToExecute,
      },
    });
  }

  processIP({
    ws,
    message: { location },
  }: {
    ws: ServerWebSocket<WSData>;
    message: z.infer<typeof SendLocationSchema>;
  }): void {
    const client = this.clients.get(ws.data.clientId);
    if (!client) return;

    client.location = location;

    this.clients.set(client.clientId, client);
  }

  getClient(clientId: string): ClientType | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get the backup state for this room
   */
  createBackup(): RoomBackupType {
    // Convert clientCache Map to object for serialization
    const clientCacheObject = Object.fromEntries(this.clientCache);

    return {
      clients: this.getClients().map((client) => ({
        clientId: client.clientId,
        username: client.username,
        isAdmin: client.isAdmin,
      })),
      audioSources: this.audioSources,
      clientCache: clientCacheObject,
    };
  }

  /**
   * Schedule cleanup after a delay
   */
  scheduleCleanup(callback: () => Promise<void>, delayMs: number): void {
    // Cancel any existing timer
    this.cancelCleanup();

    // Schedule new cleanup after specified delay
    this.cleanupTimer = setTimeout(callback, delayMs);
    console.log(`⏱️ Scheduled cleanup for room ${this.roomId} in ${delayMs}ms`);
  }

  /**
   * Cancel pending cleanup
   */
  cancelCleanup(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
      console.log(`🚫 Cleanup timer cleared for room ${this.roomId}`);
    }
  }

  /**
   * Clean up room resources (e.g., R2 storage)
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 Starting room cleanup for room ${this.roomId}...`);

    // Stop any running intervals
    this.stopSpatialAudio();
    this.stopHeartbeatChecking();

    try {
      const result = await deleteObjectsWithPrefix(`room-${this.roomId}`);
      console.log(
        `✅ Room ${this.roomId} objects deleted: ${result.deletedCount}`,
      );
    } catch (error) {
      console.error(`❌ Room ${this.roomId} cleanup failed:`, error);
    }
  }

  /**
   * Calculate gains and broadcast to all clients
   */
  private _calculateGainsAndBroadcast(server: Server): void {
    const clients = Array.from(this.clients.values());

    const gains = Object.fromEntries(
      clients.map((client) => {
        const gain = calculateGainFromDistanceToSource({
          client: client.position,
          source: this.listeningSource,
        });

        console.log(
          `Client ${client.username} at (${client.position.x}, ${
            client.position.y
          }) - gain: ${gain.toFixed(2)}`,
        );
        return [
          client.clientId,
          {
            gain,
            rampTime: 0.25,
          },
        ];
      }),
    );

    // Send the updated gains to all clients
    sendBroadcast({
      server,
      roomId: this.roomId,
      message: {
        type: "SCHEDULED_ACTION",
        serverTimeToExecute: epochNow() + 0,
        scheduledAction: {
          type: "SPATIAL_CONFIG",
          listeningSource: this.listeningSource,
          gains,
        },
      },
    });
  }

  /**
   * Start checking for stale client connections
   */
  private startHeartbeatChecking(): void {
    // Don't start if already running
    if (this.heartbeatCheckInterval) return;

    console.log(`💓 Starting heartbeat for room ${this.roomId}`);

    // Check heartbeats every second
    this.heartbeatCheckInterval = setInterval(() => {
      const now = Date.now();
      const staleClients: string[] = [];

      // Check each client's last heartbeat
      this.clients.forEach((client, clientId) => {
        const timeSinceLastResponse = now - client.lastNtpResponse;

        if (timeSinceLastResponse > NTP_CONSTANTS.RESPONSE_TIMEOUT_MS) {
          console.warn(
            `⚠️ Client ${clientId} in room ${this.roomId} has not responded for ${timeSinceLastResponse}ms`,
          );
          staleClients.push(clientId);
        }
      });

      // Remove stale clients
      staleClients.forEach((clientId) => {
        const client = this.clients.get(clientId);
        if (client) {
          console.log(
            `🔌 Disconnecting stale client ${clientId} from room ${this.roomId}`,
          );
          // Close the WebSocket connection
          try {
            const ws: ServerWebSocket<WSData> = client.ws;
            ws.close(1000, "Connection timeout - no heartbeat response");
          } catch (error) {
            console.error(
              `Error closing WebSocket for client ${clientId}:`,
              error,
            );
          }
          // Remove from room (the close event handler should also call removeClient)
          this.removeClient(clientId);
        }
      });
    }, NTP_CONSTANTS.STEADY_STATE_INTERVAL_MS);
  }

  /**
   * Stop checking for stale client connections
   */
  private stopHeartbeatChecking(): void {
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = undefined;
      console.log(`💔 Stopped heartbeat checking for room ${this.roomId}`);
    }
  }
}
