import {
  RawSearchResponseSchema,
  SearchParamsSchema,
  StreamResponseSchema,
  TrackParamsSchema,
} from "@beatsync/shared/";
import { z } from "zod";

export class MusicProviderManager {
  constructor() {
    // No providerUrl required
  }

  async search(
    query: string,
    offset: number = 0,
  ): Promise<z.infer<typeof RawSearchResponseSchema>> {
    // Stub: No external provider, return empty result or implement local search
    return RawSearchResponseSchema.parse({ results: [], total: 0 });
  }

  async stream(trackId: number) {
    // Stub: No external provider, return empty or mock stream response
    return StreamResponseSchema.parse({ url: "", format: "mp3" });
  }
}

// Export singleton instance
export const MUSIC_PROVIDER_MANAGER = new MusicProviderManager();
