"use client";

import { cn } from "@/lib/utils";
import { MAX_NTP_MEASUREMENTS, useGlobalStore } from "@/store/global";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SyncProgressProps {
  // Loading state flags
  isLoading?: boolean; // Initial loading phase (room/socket/audio)
  loadingMessage?: string; // Message for initial loading phase

  // Sync state
  isSyncComplete?: boolean; // Whether sync is complete
}

export const SyncProgress = ({
  isLoading = false,
  loadingMessage = "Loading...",
}: SyncProgressProps) => {
  // Internal state for tracking progress animation
  const syncProgress = useGlobalStore(
    (state) => state.ntpMeasurements.length / MAX_NTP_MEASUREMENTS
  );
  const isSyncComplete = useGlobalStore((state) => state.isSynced);
  const setIsLoadingAudio = useGlobalStore((state) => state.setIsLoadingAudio);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Message state based on current progress phase
  const [message, setMessage] = useState("Loading...");

  // Effect to handle initial loading animation (0-20%)
  useEffect(() => {
    // In loading phase, animate progress from 0 to 20%
    if (isLoading) {
      setMessage(loadingMessage);

      const initialLoadInterval = setInterval(() => {
        setAnimatedProgress((prev) => {
          // Cap at 0.19 (19%) to visually indicate we're still loading
          const nextProgress = prev + 0.005;
          return nextProgress >= 0.1 ? 0.1 : nextProgress;
        });
      }, 40);

      return () => clearInterval(initialLoadInterval);
    }

    // In syncing phase, scale progress from 20% to 100%
    setMessage("Synchronizing time...");

    // If sync is complete, set to 100%
    if (isSyncComplete) {
      setAnimatedProgress(1);
    } else {
      // Otherwise, scale the syncProgress to 20%-100% range
      setAnimatedProgress(0.1 + syncProgress * 0.9);
    }
  }, [isLoading, syncProgress, isSyncComplete, loadingMessage]);

  // Normalize progress to ensure it's between 0 and 1
  const normalizedProgress = Math.min(Math.max(animatedProgress, 0), 1);

  // Calculate the stroke-dashoffset based on progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  if (isSyncComplete) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black">
        <motion.div
          className="flex flex-col items-center justify-center p-8 bg-yellow-300 border-2 border-black rounded-none max-w-md w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-mono uppercase tracking-tight mb-4 text-black">
            BEATSYNC READY
          </h2>
          <div className="w-full h-px bg-black mb-4"></div>
          <p className="font-mono text-black mb-8 text-center uppercase text-sm">
            SYNC COMPLETE — SYSTEM OPERATIONAL
          </p>
          <motion.button
            className="px-8 py-3 bg-black text-yellow-300 rounded-none font-mono uppercase text-sm tracking-wider border-2 border-black cursor-pointer"
            whileHover={{ backgroundColor: "#333", color: "#FFE600" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsLoadingAudio(false)}
          >
            START SYSTEM
          </motion.button>
          <div className="grid grid-cols-4 gap-2 mt-6 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2 bg-black"></div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black">
      <motion.div
        className="flex flex-col items-center justify-center p-8 bg-yellow-300 border-2 border-black rounded-none max-w-md w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-mono uppercase tracking-tight mb-4 text-black">
          BEATSYNC CALIBRATING
        </h2>
        <div className="w-full h-px bg-black mb-4"></div>

        {/* Progress circle */}
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#000"
              strokeWidth="4"
            />

            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#000"
              strokeWidth="8"
              strokeLinecap="butt"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - normalizedProgress)}
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
              }}
            />
          </svg>

          {/* Progress text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-mono text-xl font-bold text-black">
              {`${Math.round(normalizedProgress * 100)}%`}
            </div>
          </div>
        </div>

        <p className="font-mono text-black mb-4 text-center uppercase text-sm">
          {message}
        </p>

        {/* <p className="font-mono text-black mb-6 text-center text-xs">
          {subMessage}
        </p> */}

        <div className="grid grid-cols-4 gap-2 mt-2 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2",
                i <= normalizedProgress * 4 ? "bg-black" : "bg-zinc-700"
              )}
            ></div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
