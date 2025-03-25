import { AudioSource, UploadAudioSchema } from "@beatsync/shared/types";
import { randomUUIDv7, Server } from "bun";

import * as path from "path";
import { errorResponse, jsonResponse } from "../utils/responses";

const AUDIO_DIR = path.join(process.cwd(), "uploads", "audio");

export const handleUpload = async (req: Request, server: Server) => {
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

    // Parse and validate the request body using Zod schema
    const rawBody = await req.json();
    const parseResult = UploadAudioSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return errorResponse(
        `Invalid request data: ${parseResult.error.message}`,
        400
      );
    }

    const { name, audioData, roomId } = parseResult.data;

    // Generate unique filename with UUID and prepend room ID
    const uuid = randomUUIDv7();
    const ext = path.extname(name) || ".mp3"; // Preserve original extension or default to mp3
    const serverFilename = `room-${roomId}_${uuid}${ext}`;
    const filePath = path.join(AUDIO_DIR, serverFilename);

    // Decode base64 audio data and write to file
    const audioBuffer = Buffer.from(audioData, "base64");
    await Bun.write(filePath, audioBuffer);

    // Store original filename metadata in audio source
    const message: AudioSource = {
      type: "NEW_AUDIO_SOURCE",
      id: serverFilename,
      title: name, // Keep original name for display
      duration: 1, // TODO: lol calculate this later properly
      addedAt: Date.now(),
      addedBy: roomId,
    };

    // Broadcast to all clients in the room
    server.publish(roomId, JSON.stringify(message));

    // Return success response with the file details
    return jsonResponse({
      success: true,
    }); // Wait for the broadcast to be received.
  } catch (error) {
    console.error("Error handling upload:", error);
    return errorResponse("Failed to process upload", 500);
  }
};
