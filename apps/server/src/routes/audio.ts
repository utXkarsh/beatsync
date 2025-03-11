import { Server } from "bun";
import * as path from "path";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

export const handleGetYouTubeAudio = async (req: Request, server: Server) => {
  const url = new URL(req.url);
  const audioId = url.searchParams.get("audioId");
  const audioPath = path.join(AUDIO_DIR, `${audioId}.mp3`);
  return new Response(Bun.file(audioPath));
};
