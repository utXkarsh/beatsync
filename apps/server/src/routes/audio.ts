import { GetAudioSchema } from "@beatsync/shared";
import { Server } from "bun";
import * as path from "path";
import { AUDIO_DIR } from "../config";
import { errorResponse } from "../utils/responses";

export const handleGetAudio = async (req: Request, server: Server) => {
  try {
    // Check if it's a POST request
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    // Check content type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return errorResponse("Content-Type must be application/json", 400);
    }

    // Parse and validate the request body
    const rawBody = await req.json();
    const parseResult = GetAudioSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return errorResponse(
        `Invalid request data: ${parseResult.error.message}`,
        400
      );
    }

    const { id } = parseResult.data;

    // Create a BunFile reference to the audio file
    // The id already contains the room-specific path
    const audioPath = path.join(AUDIO_DIR, id);
    const file = Bun.file(audioPath);

    // Check if file exists using Bun.file's exists() method
    if (!(await file.exists())) {
      return errorResponse("Audio file not found", 404);
    }

    // Return the file directly as the response body
    return new Response(file, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": file.size.toString(),
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error handling audio request:", error);
    return errorResponse("Failed to process audio request", 500);
  }
};
