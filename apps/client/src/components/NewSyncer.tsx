"use client";
import { useGlobalStore } from "@/store/global";
import { useEffect, useState } from "react";
import { Dashboard } from "./dashboard/Dashboard";
import { SpatialAudioBackground } from "./room/SpatialAudioBackground";
import { WebSocketManager } from "./room/WebSocketManager";

// Main component has been refactored into smaller components

export const NewSyncer = () => {
  // Get sync state from store
  const isSynced = useGlobalStore((state) => state.isSynced);

  // Transition state for delayed showing of main UI
  const [showingSyncScreen, setShowingSyncScreen] = useState(true);

  // Effect to hide sync screen after sync completes
  useEffect(() => {
    if (isSynced && showingSyncScreen) {
      setShowingSyncScreen(false);
    }
  }, [isSynced, showingSyncScreen]);

  return (
    <>
      {/* WebSocket connection manager (non-visual component) */}
      <WebSocketManager />

      {/* Spatial audio background effects */}
      <SpatialAudioBackground />

      <Dashboard />
    </>
  );
};
