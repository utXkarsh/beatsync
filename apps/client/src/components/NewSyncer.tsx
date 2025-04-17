"use client";
import { useGlobalStore } from "@/store/global";
import { ClientType } from "@beatsync/shared";
import { useEffect, useState } from "react";
import { Dashboard } from "./dashboard/Dashboard";
import { SpatialAudioBackground } from "./room/SpatialAudioBackground";
import { SyncStatus } from "./room/SyncStatus";
import { WebSocketManager } from "./room/WebSocketManager";

// Main component has been refactored into smaller components

export const NewSyncer = () => {
  // Get sync state from store
  const isSynced = useGlobalStore((state) => state.isSynced);
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);

  // Transition state for delayed showing of main UI
  const [showingSyncScreen, setShowingSyncScreen] = useState(true);

  // Effect to hide sync screen after sync completes
  useEffect(() => {
    if (isSynced && showingSyncScreen) {
      setShowingSyncScreen(false);
    }
  }, [isSynced, showingSyncScreen]);

  // This is just a placeholder function that's passed to WebSocketManager
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClientsChange = (newClients: ClientType[]) => {
    // We don't need to do anything with the clients in this component
  };

  return (
    <>
      {/* WebSocket connection manager (non-visual component) */}
      <WebSocketManager onClientsChange={handleClientsChange} />

      {/* Spatial audio background effects */}
      <SpatialAudioBackground />

      {/* Sync Status overlay */}
      <SyncStatus />

      {/* Main dashboard only visible when synced and not loading */}
      {isSynced && !isLoadingAudio && <Dashboard />}
    </>
  );
};
