"use client";

import { motion } from "framer-motion";

interface SyncProgressProps {
  progress: number; // 0 to 1
}

export const SyncProgress = ({ progress }: SyncProgressProps) => {
  // Normalize progress to ensure it's between 0 and 1
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);

  // Calculate the stroke-dashoffset based on progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center justify-center p-8">
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
            transition={{ duration: 0.5, ease: "easeInOut" }}
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
          className="relative z-10 text-2xl font-semibold text-gray-700"
          key={Math.round(normalizedProgress * 100)}
        >
          {Math.round(normalizedProgress * 100)}%
        </div>
      </div>
      <motion.p
        className="mt-4 text-gray-600 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Syncing with server...
      </motion.p>
      <motion.p
        className="text-sm text-gray-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Calibrating time synchronization
      </motion.p>
    </div>
  );
};
