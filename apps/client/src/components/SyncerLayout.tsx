import { useGlobalStore } from "@/store/global";
import { Dashboard } from "./dashboard/Dashboard";
import { SyncStatus } from "./room/SyncStatus";

export const SyncerLayout = () => {
  const isSynced = useGlobalStore((state) => state.isSynced);
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);

  return (
    <div>
      {/* Sync Status overlay */}
      <SyncStatus />

      {/* Main dashboard only visible when synced and not loading */}
      {isSynced && !isLoadingAudio && <Dashboard />}
    </div>
  );
};
