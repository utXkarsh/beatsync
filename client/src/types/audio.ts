/**
 * NTP measurement data
 */
export interface NTPMeasurement {
  t0: number;
  t1: number;
  t2: number;
  t3: number;
  roundTripDelay: number;
  clockOffset: number;
}

/**
 * Props for the TimingDisplay component
 */
export interface TimingDisplayProps {
  currentTime: number; // in milliseconds
  isPlaying: boolean;
  totalNudge: number; // in milliseconds
  clockOffset: number | null; // in milliseconds
}

/**
 * Audio loading state
 */
export type AudioLoadingState = "loading" | "ready" | "error";

/**
 * Scheduled action data
 */
export interface ScheduledAction {
  type: string;
  time: number;
}
