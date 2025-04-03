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

export const WSRequestSchema = z.discriminatedUnion("type", [
  PlayActionSchema,
  PauseActionSchema,
  NTPRequestPacketSchema,
]);
export type WSRequestType = z.infer<typeof WSRequestSchema>;
