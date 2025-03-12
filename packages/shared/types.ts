import { z } from "zod";

export const ClientActionEnum = z.enum([
  "PLAY",
  "PAUSE",
  "JOIN",
  "NTP_REQUEST",
]);
export type ClientAction = z.infer<typeof ClientActionEnum>;

export const PlayActionSchema = z.object({
  type: z.literal(ClientActionEnum.enum.PLAY),
  trackTimeSeconds: z.number(),
  trackIndex: z.number(),
});

export const PauseActionSchema = z.object({
  type: z.literal(ClientActionEnum.enum.PAUSE),
});

export const ExtractAudioSourceSchema = z.object({
  url: z.string().url(),
  roomId: z.string(),
  username: z.string(),
});
export type ExtractAudioSource = z.infer<typeof ExtractAudioSourceSchema>;

export const NTPResponseMessageSchema = z.object({
  type: z.literal("NTP_RESPONSE"),
  t0: z.number(), // Client send timestamp (echoed back)
  t1: z.number(), // Server receive timestamp
  t2: z.number(), // Server send timestamp
});

const JoinMessageSchema = z.object({
  type: z.literal(ClientActionEnum.enum.JOIN),
  username: z.string(),
  userId: z.string(),
});

const NTPRequestMessageSchema = z.object({
  type: z.literal(ClientActionEnum.enum.NTP_REQUEST),
  t0: z.number(), // Client send timestamp
});

export const WSRequestSchema = z.discriminatedUnion("type", [
  PlayActionSchema,
  PauseActionSchema,
  JoinMessageSchema,
  NTPRequestMessageSchema,
]);

export const ScheduledActionSchema = z.object({
  type: z.literal("SCHEDULED_ACTION"),
  timeToExecute: z.number(),
  scheduledAction: z.discriminatedUnion("type", [
    PlayActionSchema,
    PauseActionSchema,
  ]),
});

export const RoomEventSchema = z.object({
  type: z.literal("ROOM_EVENT"),
  event: WSRequestSchema,
});
export type RoomEvent = z.infer<typeof RoomEventSchema>;

export const AudioSourceSchema = z.object({
  type: z.literal("NEW_AUDIO_SOURCE"),
  id: z.string(),
  title: z.string(),
  duration: z.number().positive(),
  thumbnail: z.string().url().optional(),
  addedAt: z.number(),
  addedBy: z.string(),
});
export type AudioSource = z.infer<typeof AudioSourceSchema>;

export const WSResponseSchema = z.discriminatedUnion("type", [
  NTPResponseMessageSchema,
  ScheduledActionSchema,
  RoomEventSchema,
  AudioSourceSchema,
]);
export type WSResponse = z.infer<typeof WSResponseSchema>;

export type NTPRequestMessage = z.infer<typeof NTPRequestMessageSchema>;
export type PlayActionMessage = z.infer<typeof PlayActionSchema>;
export type NTPResponseMessage = z.infer<typeof NTPResponseMessageSchema>;
export type WSRequest = z.infer<typeof WSRequestSchema>;
