import { z } from "zod";

// Info about a song selected by a user
export const SongInfoSchema = z.object({
  songId: z.string(),
  url: z.string(),
  title: z.string(),
});
export type SongInfo = z.infer<typeof SongInfoSchema>;

// Room feature flag and per-user playback mapping
export const RoomFeaturesSchema = z.object({
  perUserPlaybackEnabled: z.boolean().default(false),
});
export type RoomFeatures = z.infer<typeof RoomFeaturesSchema>;

// Per-user playback mapping: userId -> SongInfo
export const UserPlaybackSchema = z.record(z.string(), SongInfoSchema);
export type UserPlayback = Record<string, SongInfo>;

// Extend RoomType (if exists elsewhere) or define here for reference
export interface RoomPlaybackExtension {
  features: RoomFeatures;
  userPlayback: UserPlayback;
}
