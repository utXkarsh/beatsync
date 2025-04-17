import { Server } from "bun";

import { UploadAudioSchema } from "@beatsync/shared";
import { mkdir } from "node:fs/promises";
import * as path from "path";
import { AUDIO_DIR } from "../config";
import { errorResponse, jsonResponse, sendBroadcast } from "../utils/responses";

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

    // Create room-specific directory if it doesn't exist
    const roomDir = path.join(AUDIO_DIR, `room-${roomId}`);
    await mkdir(roomDir, { recursive: true });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(name) || ".mp3"; // Preserve original extension or default to mp3
    const filename = `${timestamp}${ext}`;

    // The ID that will be used for retrieving the file (includes room path)
    const fileId = path.join(`room-${roomId}`, filename);
    // Full path to the file
    const filePath = path.join(AUDIO_DIR, fileId);

    // Decode base64 audio data and write to file using Bun.write
    const audioBuffer = Buffer.from(audioData, "base64");
    await Bun.write(filePath, audioBuffer);

    sendBroadcast({
      server,
      roomId,
      message: {
        type: "ROOM_EVENT",
        event: {
          type: "NEW_AUDIO_SOURCE",
          id: fileId,
          title: name, // Keep original name for display
          duration: 1, // TODO: lol calculate this later properly
          addedAt: Date.now(),
          addedBy: roomId,
        },
      },
    });

    // Return success response with the file details
    return jsonResponse({
      success: true,
    }); // Wait for the broadcast to be received.
  } catch (error) {
    console.error("Error handling upload:", error);
    return errorResponse("Failed to process upload", 500);
  }
};
