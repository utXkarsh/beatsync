import { z } from "zod";
import { PositionSchema } from "./basic";
export const ClientSchema = z.object({
  username: z.string(),
  clientId: z.string(),
});

export const ClientActionEnum = z.enum([
  "PLAY",
  "PAUSE",
  "NTP_REQUEST",
  "START_SPATIAL_AUDIO",
  "STOP_SPATIAL_AUDIO",
  "REORDER_CLIENT",
  "SET_LISTENING_SOURCE",
  "MOVE_CLIENT",
  "SYNC", // Client joins late, requests sync
  "SET_ADMIN", // Set admin status
  "SET_PLAYBACK_CONTROLS", // Set playback controls
  "SEND_IP", // Send IP to server
]);

export const NTPRequestPacketSchema = z.object({
  type: z.literal(ClientActionEnum.enum.NTP_REQUEST),
  t0: z.number(), // Client send timestamp
  t1: z.number().optional(), // Server receive timestamp (will be set by the server)
});

export const PlayActionSchema = z.object({
  type: z.literal(ClientActionEnum.enum.PLAY),
  trackTimeSeconds: z.number(),
  audioSource: z.string(),
});

export const PauseActionSchema = z.object({
  type: z.literal(ClientActionEnum.enum.PAUSE),
  audioSource: z.string(),
  trackTimeSeconds: z.number(),
});

const StartSpatialAudioSchema = z.object({
  type: z.literal(ClientActionEnum.enum.START_SPATIAL_AUDIO),
});

const StopSpatialAudioSchema = z.object({
  type: z.literal(ClientActionEnum.enum.STOP_SPATIAL_AUDIO),
});

const ReorderClientSchema = z.object({
  type: z.literal(ClientActionEnum.enum.REORDER_CLIENT),
  clientId: z.string(),
});

const SetListeningSourceSchema = z.object({
  type: z.literal(ClientActionEnum.enum.SET_LISTENING_SOURCE),
  x: z.number(),
  y: z.number(),
});

const MoveClientSchema = z.object({
  type: z.literal(ClientActionEnum.enum.MOVE_CLIENT),
  clientId: z.string(),
  position: PositionSchema,
});
export type MoveClientType = z.infer<typeof MoveClientSchema>;

const ClientRequestSyncSchema = z.object({
  type: z.literal(ClientActionEnum.enum.SYNC),
});
export type ClientRequestSyncType = z.infer<typeof ClientRequestSyncSchema>;

const SetAdminSchema = z.object({
  type: z.literal(ClientActionEnum.enum.SET_ADMIN),
  clientId: z.string(), // The client to set admin status for
  isAdmin: z.boolean(), // The new admin status
});

export const PlaybackControlsPermissionsEnum = z.enum([
  "ADMIN_ONLY",
  "EVERYONE",
]);
export type PlaybackControlsPermissionsType = z.infer<
  typeof PlaybackControlsPermissionsEnum
>;

export const SetPlaybackControlsSchema = z.object({
  type: z.literal(ClientActionEnum.enum.SET_PLAYBACK_CONTROLS),
  permissions: PlaybackControlsPermissionsEnum,
});

// Zod schema for ipwho.is response based on API documentation
export const IpWhoResponseSchema = z.object({
  ip: z.string(),
  success: z.boolean(),
  type: z.string(), // "IPv4" or "IPv6"
  continent: z.string(),
  continent_code: z.string(),
  country: z.string(),
  country_code: z.string(), // 2-letter ISO code
  region: z.string(),
  region_code: z.string().optional(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  is_eu: z.boolean(),
  postal: z.string().optional(),
  calling_code: z.string(),
  capital: z.string(),
  borders: z.string().optional(),
  flag: z.object({
    img: z.string(), // SVG flag URL
    emoji: z.string(), // Flag emoji
    emoji_unicode: z.string(),
  }),
  timezone: z.object({
    id: z.string(), // IANA format e.g. "America/Los_Angeles"
    abbr: z.string(),
    is_dst: z.boolean(),
    offset: z.number(),
    utc: z.string(),
    current_time: z.string(),
  }),
  message: z.string().optional(), // Only present when success is false
});

// Type inference from schema
export type IpWhoResponse = z.infer<typeof IpWhoResponseSchema>;

export const SendIpSchema = z.object({
  type: z.literal(ClientActionEnum.enum.SEND_IP),
  ip: IpWhoResponseSchema,
});

export const WSRequestSchema = z.discriminatedUnion("type", [
  PlayActionSchema,
  PauseActionSchema,
  NTPRequestPacketSchema,
  StartSpatialAudioSchema,
  StopSpatialAudioSchema,
  ReorderClientSchema,
  SetListeningSourceSchema,
  MoveClientSchema,
  ClientRequestSyncSchema,
  SetAdminSchema,
  SetPlaybackControlsSchema,
  SendIpSchema,
]);
export type WSRequestType = z.infer<typeof WSRequestSchema>;
export type PlayActionType = z.infer<typeof PlayActionSchema>;
export type PauseActionType = z.infer<typeof PauseActionSchema>;
export type ReorderClientType = z.infer<typeof ReorderClientSchema>;
export type SetListeningSourceType = z.infer<typeof SetListeningSourceSchema>;

// Mapped type to access request types by their type field
export type ExtractWSRequestFrom = {
  [K in WSRequestType["type"]]: Extract<WSRequestType, { type: K }>;
};
