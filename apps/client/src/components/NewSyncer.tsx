"use client";
import { motion } from "framer-motion";
import { Dashboard } from "./dashboard/Dashboard";
import { WebSocketManager } from "./room/WebSocketManager";

// Main component has been refactored into smaller components
export const NewSyncer = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* WebSocket connection manager (non-visual component) */}
      <WebSocketManager />

      {/* Spatial audio background effects */}
      {/* <SpatialAudioBackground /> */}

      <Dashboard />
    </motion.div>
  );
};
