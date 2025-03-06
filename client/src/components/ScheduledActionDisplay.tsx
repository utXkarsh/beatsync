"use client";

import { ScheduledAction } from "@/types/audio";
import React, { useEffect, useState } from "react";

interface ScheduledActionDisplayProps {
  scheduledAction: ScheduledAction | null;
}

export const ScheduledActionDisplay: React.FC<ScheduledActionDisplayProps> = ({
  scheduledAction,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  // Update countdown timer for scheduled action
  useEffect(() => {
    if (!scheduledAction) {
      setCountdown(null);
      return;
    }

    // Initial countdown
    setCountdown(Math.max(0, scheduledAction.time - Date.now()));

    // Update countdown every 10ms
    const intervalId = setInterval(() => {
      const remaining = Math.max(0, scheduledAction.time - Date.now());
      setCountdown(remaining);

      // Clear interval if countdown reaches 0
      if (remaining === 0) {
        clearInterval(intervalId);
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [scheduledAction]);

  if (!scheduledAction) {
    return null;
  }

  return (
    <div className="mt-4 p-4 border rounded max-w-md w-full bg-yellow-50">
      <h3 className="font-bold">Scheduled Action</h3>
      <p>Action: {scheduledAction.type}</p>
      <p>Scheduled at: {new Date(scheduledAction.time).toLocaleTimeString()}</p>
      {countdown !== null && (
        <p className="font-bold text-lg">
          Executing in: {(countdown / 1000).toFixed(2)}s
        </p>
      )}
    </div>
  );
};
