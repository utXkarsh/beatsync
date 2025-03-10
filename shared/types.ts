import { z } from "zod";

export const ClientActionEnum = z.enum([
  "PLAY",
  "PAUSE",
  "JOIN",
  "NTP_REQUEST",
  "NEW_AUDIO_SOURCE",
]);
export type ClientAction = z.infer<typeof ClientActionEnum>;

export const AudioSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  duration: z.number().positive(),
  thumbnail: z.string().url().optional(),
  addedAt: z.number(),
});

export type AudioSource = z.infer<typeof AudioSourceSchema>;

export const PlayActionSchema = z.object({
  type: z.literal(ClientActionEnum.enum.PLAY),
  time: z.number(),
  trackIndex: z.number(),
});

export const PauseActionSchema = z.object({
  type: z.literal(ClientActionEnum.enum.PAUSE),
});

export const NTPResponseMessageSchema = z.object({
  type: z.literal("NTP_RESPONSE"),
  t0: z.number(), // Client send timestamp (echoed back)
  t1: z.number(), // Server receive timestamp
  t2: z.number(), // Server send timestamp
});

export const NewAudioSourceMessageSchema = z.object({
  type: z.literal(ClientActionEnum.enum.NEW_AUDIO_SOURCE),
  source: AudioSourceSchema,
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
  NewAudioSourceMessageSchema,
  JoinMessageSchema,
  NTPRequestMessageSchema,
]);

export const ScheduledActionSchema = z.object({
  type: z.literal("SCHEDULED_ACTION"),
  action: z.enum(["PLAY", "PAUSE"]),
  timeToExecute: z.number(), // server time to execute
});

export const RoomEventSchema = z.object({
  type: z.literal("ROOM_EVENT"),
  event: WSRequestSchema,
});
export type RoomEvent = z.infer<typeof RoomEventSchema>;

export const WSResponseSchema = z.discriminatedUnion("type", [
  NTPResponseMessageSchema,
  ScheduledActionSchema,
  RoomEventSchema,
]);
export type WSResponse = z.infer<typeof WSResponseSchema>;

export type NTPRequestMessage = z.infer<typeof NTPRequestMessageSchema>;
export type PlayActionMessage = z.infer<typeof PlayActionSchema>;
export type NTPResponseMessage = z.infer<typeof NTPResponseMessageSchema>;
export type NewAudioSourceMessage = z.infer<typeof NewAudioSourceMessageSchema>;
export type WSMessage = z.infer<typeof WSRequestSchema>;
