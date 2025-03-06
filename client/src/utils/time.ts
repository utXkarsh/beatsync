// Time formatting and calculation utilities

/**
 * Format time with millisecond precision
 */
export const formatTimeMicro = (timeMs: number): string => {
  const milliseconds = Math.floor(timeMs) % 1000;
  const seconds = Math.floor(timeMs / 1000) % 60;
  const minutes = Math.floor(timeMs / 60000);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
};

/**
 * Calculate wait time for synchronized actions
 */
export const calculateWaitTime = (
  targetServerTime: number,
  clockOffset: number | null
): number => {
  // Calculate the current server time based on our local time and clock offset
  const estimatedCurrentServerTime = Date.now() + (clockOffset || 0);

  // Calculate how long to wait before executing the action
  // If waitTime is negative, we're already past the target time, so execute immediately
  return Math.max(0, targetServerTime - estimatedCurrentServerTime);
};
