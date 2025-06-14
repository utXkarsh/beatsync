import { Server } from "bun";

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
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return errorResponse("Content-Type must be multipart/form-data", 400);
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const roomId = formData.get("roomId") as string | null;

    if (!audioFile || !roomId) {
      return errorResponse("Missing required fields: audio file and roomId", 400);
    }

    // Validate file is actually an audio file
    if (!audioFile.type.startsWith("audio/")) {
      return errorResponse("File must be an audio file", 400);
    }

    const name = audioFile.name;

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

    // Get the audio data as ArrayBuffer and write to file
    const audioBuffer = await audioFile.arrayBuffer();
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
