"use client";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { motion } from "motion/react";

export const SpatialAudioBackground = () => {
  const userId = useRoomStore((state) => state.userId);
  const spatialConfig = useGlobalStore((state) => state.spatialConfig);
  
  // Check if the current user's device is the active one in spatial audio
  const isCurrentDeviceActive = spatialConfig?.gains[userId]?.gain === 1;

  if (!isCurrentDeviceActive) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 1.5 }}
        className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-blue-600/50 via-pink-500/30 to-blue-400/25 blur-lg"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ duration: 1.2 }}
        className="fixed inset-0 pointer-events-none -z-10 bg-radial-gradient from-pink-600/50 via-transparent to-transparent blur-xl mix-blend-screen"
      />

      {/* Additional color spots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.5, 0.7, 0.5],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="fixed top-[10%] left-[15%] w-[30vw] h-[30vw] rounded-full bg-pink-600/20 blur-3xl pointer-events-none -z-10"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.4, 0.6, 0.4],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="fixed bottom-[20%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-purple-600/20 blur-3xl pointer-events-none -z-10"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="fixed top-[40%] right-[20%] w-[20vw] h-[20vw] rounded-full bg-blue-500/20 blur-3xl pointer-events-none -z-10"
      />

      {/* New highlight spots for extra pop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="fixed top-[30%] left-[30%] w-[15vw] h-[15vw] rounded-full bg-cyan-500/20 blur-2xl pointer-events-none -z-10"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.15, 1],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="fixed bottom-[35%] left-[15%] w-[18vw] h-[18vw] rounded-full bg-indigo-500/20 blur-2xl pointer-events-none -z-10"
      />
    </>
  );
};
