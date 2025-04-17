"use client";
import { Dashboard } from "./dashboard/Dashboard";
import { WebSocketManager } from "./room/WebSocketManager";

// Main component has been refactored into smaller components
export const NewSyncer = () => {
  return (
    <>
      {/* WebSocket connection manager (non-visual component) */}
      <WebSocketManager />

      {/* Spatial audio background effects */}
      {/* <SpatialAudioBackground /> */}

      <Dashboard />
    </>
  );
};
