import { z } from "zod";
import {
  LocationSchema,
  PauseActionSchema,
  PlayActionSchema,
  SetPlaybackControlsSchema,
} from "./WSRequest";
import { AudioSourceSchema, PositionSchema } from "./basic";
import { SongInfoSchema } from "./room";

// Client change
const ClientSchema = z.object({
  username: z.string(),
  clientId: z.string(),
  ws: z.any(),
  rtt: z.number().nonnegative().default(0), // Round-trip time in milliseconds
  position: PositionSchema,
  lastNtpResponse: z.number().default(0), // Last NTP response timestamp
  isAdmin: z.boolean().default(false), // Admin status
  location: LocationSchema.optional(),
});
export type ClientType = z.infer<typeof ClientSchema>;
const ClientChangeMessageSchema = z.object({
  type: z.literal("CLIENT_CHANGE"),
  clients: z.array(ClientSchema),
});

// Set audio sources
const SetAudioSourcesSchema = z.object({
  type: z.literal("SET_AUDIO_SOURCES"),
  sources: z.array(AudioSourceSchema),
});
export type SetAudioSourcesType = z.infer<typeof SetAudioSourcesSchema>;

const SetUserPlaybackSchema = z.object({
  type: z.literal("SET_USER_PLAYBACK"),
  userPlayback: z.record(z.string(), SongInfoSchema),
});
export type SetUserPlaybackType = z.infer<typeof SetUserPlaybackSchema>;

const RoomEventSchema = z.object({
  type: z.literal("ROOM_EVENT"),
  event: z.discriminatedUnion("type", [
    ClientChangeMessageSchema,
    SetAudioSourcesSchema,
    SetPlaybackControlsSchema,
    SetUserPlaybackSchema,
  ]),
});

// SCHEDULED ACTIONS
const SpatialConfigSchema = z.object({
  type: z.literal("SPATIAL_CONFIG"),
  gains: z.record(
    z.string(),
    z.object({ gain: z.number().min(0).max(1), rampTime: z.number() }),
  ),
  listeningSource: PositionSchema,
});

export type SpatialConfigType = z.infer<typeof SpatialConfigSchema>;

const StopSpatialAudioSchema = z.object({
  type: z.literal("STOP_SPATIAL_AUDIO"),
});
export type StopSpatialAudioType = z.infer<typeof StopSpatialAudioSchema>;

const StreamJobUpdateSchema = z.object({
  type: z.literal("STREAM_JOB_UPDATE"),
  activeJobCount: z.number().nonnegative(),
});
export type StreamJobUpdateType = z.infer<typeof StreamJobUpdateSchema>;

export const ScheduledActionSchema = z.object({
  type: z.literal("SCHEDULED_ACTION"),
  serverTimeToExecute: z.number(),
  scheduledAction: z.discriminatedUnion("type", [
    PlayActionSchema,
    PauseActionSchema,
    SpatialConfigSchema,
    StopSpatialAudioSchema,
  ]),
});

// Export both broadcast types
export const WSBroadcastSchema = z.discriminatedUnion("type", [
  ScheduledActionSchema,
  RoomEventSchema,
  StreamJobUpdateSchema,
]);
export type WSBroadcastType = z.infer<typeof WSBroadcastSchema>;
