import { z } from "zod";

export const ClientSchema = z.object({
  username: z.string(),
  clientId: z.string(),
});

export const ClientActionEnum = z.enum([
  "PLAY",
  "PAUSE",
  "CLIENT_CHANGE",
  "NTP_REQUEST",
  "START_SPATIAL_AUDIO",
  "STOP_SPATIAL_AUDIO",
]);

export const NTPRequestPacketSchema = z.object({
  type: z.literal(ClientActionEnum.enum.NTP_REQUEST),
  t0: z.number(), // Client send timestamp
});

export const PlayActionSchema = z.object({
  type: z.literal(ClientActionEnum.enum.PLAY),
  trackTimeSeconds: z.number(),
  trackIndex: z.number(),
});

export const PauseActionSchema = z.object({
  type: z.literal(ClientActionEnum.enum.PAUSE),
});

const StartSpatialAudioSchema = z.object({
  type: z.literal(ClientActionEnum.enum.START_SPATIAL_AUDIO),
});

const StopSpatialAudioSchema = z.object({
  type: z.literal(ClientActionEnum.enum.STOP_SPATIAL_AUDIO),
});

export const WSRequestSchema = z.discriminatedUnion("type", [
  PlayActionSchema,
  PauseActionSchema,
  NTPRequestPacketSchema,
  StartSpatialAudioSchema,
  StopSpatialAudioSchema,
]);
export type WSRequestType = z.infer<typeof WSRequestSchema>;
