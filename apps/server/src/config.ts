import * as path from "path";

// Path configurations (legacy - will be replaced by R2)
export const AUDIO_DIR = path.join(process.cwd(), "uploads", "audio");

// https://developers.cloudflare.com/r2/api/s3/api/
// R2 Configuration

// Audio settings
export const AUDIO_LOW = 0.15;
export const AUDIO_HIGH = 1.0;
export const VOLUME_UP_RAMP_TIME = 0.5;
export const VOLUME_DOWN_RAMP_TIME = 0.5;

// Scheduling settings
export const SCHEDULE_TIME_MS = 750;
