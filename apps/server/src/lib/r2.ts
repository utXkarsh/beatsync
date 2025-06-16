import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_CONFIG = {
  BUCKET_NAME: process.env.S3_BUCKET_NAME!,
  PUBLIC_URL: process.env.S3_PUBLIC_URL!,
  ENDPOINT: process.env.S3_ENDPOINT!,
  ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID!,
  SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY!,
};

// Create R2 client instance
const r2Client = new S3Client({
  region: "auto",
  endpoint: S3_CONFIG.ENDPOINT,
  credentials: {
    accessKeyId: S3_CONFIG.ACCESS_KEY_ID,
    secretAccessKey: S3_CONFIG.SECRET_ACCESS_KEY,
  },
});

export interface AudioFileMetadata {
  roomId: string;
  fileName: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Generate a presigned URL for uploading audio files to R2
 */
export async function generatePresignedUploadUrl(
  roomId: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const key = `room-${roomId}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      roomId,
      uploadedAt: new Date().toISOString(),
    },
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Get the public URL for an audio file (if public access is enabled)
 */
export function getPublicAudioUrl(roomId: string, fileName: string): string {
  return `${S3_CONFIG.PUBLIC_URL}/${S3_CONFIG.BUCKET_NAME}/room-${roomId}/${fileName}`;
}

/**
 * Generate a unique file name for audio uploads
 */
export function generateAudioFileName(originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop() || "mp3";
  return `${timestamp}.${extension}`;
}

/**
 * Validate R2 configuration
 */
export function validateR2Config(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(S3_CONFIG)) {
    if (!value) {
      errors.push(`S3 CONFIG: ${key} is not defined`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Delete a single audio file from R2
 */
export async function deleteAudioFile(
  roomId: string,
  fileName: string
): Promise<boolean> {
  try {
    const key = `room-${roomId}/${fileName}`;

    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to delete R2 file ${roomId}/${fileName}:`, error);
    return false;
  }
}

/**
 * Delete all audio files for a room from R2 TODO:
 */
