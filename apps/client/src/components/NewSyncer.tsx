"use client";
import { useGlobalStore } from "@/store/global";
import { ClientType } from "@beatsync/shared";
import { useEffect, useState } from "react";
import { ConnectedUsers } from "./room/ConnectedUsers";
import { MusicControls } from "./room/MusicControls";
import { MusicUpload } from "./room/MusicUpload";
import { RoomInfo } from "./room/RoomInfo";
import { SpatialAudioBackground } from "./room/SpatialAudioBackground";
import { SyncStatus } from "./room/SyncStatus";
import { WebSocketManager } from "./room/WebSocketManager";
import { SocketStatus } from "./room/SocketStatus";

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

  // This is just a placeholder function that's passed to WebSocketManager
  // We don't need to do anything with the clients in the parent component anymore
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
      
      <div className="container mx-auto p-4 space-y-6 relative">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Room information card */}
          <RoomInfo />

          {/* Connected users card */}
          <ConnectedUsers />
        </div>

        <div className="flex items-center gap-2">
          <SocketStatus />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Music controls section */}
          <MusicControls />

          {/* Music upload section */}
          <MusicUpload />
        </div>

        {/* Network synchronization section */}
        <SyncStatus />
      </div>
    </>
  );
};
