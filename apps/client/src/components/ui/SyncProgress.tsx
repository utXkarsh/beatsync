"use client";

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
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Message state based on current progress phase
  const [message, setMessage] = useState("Loading...");
  const [subMessage, setSubMessage] = useState("Please wait...");

  // Effect to handle initial loading animation (0-20%)
  useEffect(() => {
    // In loading phase, animate progress from 0 to 20%
    if (isLoading) {
      setMessage(loadingMessage);
      setSubMessage("Please wait while we set things up");

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
    setMessage("Syncing with server...");
    setSubMessage("Calibrating time synchronization");

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

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-white">
      <motion.div
        className="flex flex-col items-center justify-center p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Neumorphic container */}
          <div className="absolute inset-0 rounded-full bg-gray-100 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]"></div>

          {/* Progress circle */}
          <svg className="absolute w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke=""
              strokeWidth="8"
              className="drop-shadow-lg"
            />

            {/* Progress circle - counterclockwise */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              className={"stroke-[16px] drop-shadow-lg"}
              stroke="url(#progressGradient)"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{
                strokeDashoffset: circumference * (1 - normalizedProgress),
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
              }}
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient
                id="progressGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center neumorphic circle */}
          <div className="absolute w-28 h-28 rounded-full bg-gray-100 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.9)] flex items-center justify-center"></div>

          {/* Progress text */}
          <div
            className="relative z-10 text-2xl font-semibold text-gray-700 font-mono"
            key={Math.round(normalizedProgress * 100)}
          >
            {`${Math.round(normalizedProgress * 100)}%`}
          </div>
        </div>
        <motion.p
          className="mt-4 text-gray-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {message}
        </motion.p>
        <motion.p
          className="text-sm text-gray-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {subMessage}
        </motion.p>
      </motion.div>
    </div>
  );
};
