import { useGlobalStore } from "@/store/global";
import { Dashboard } from "./dashboard/Dashboard";
import { TopBar } from "./room/TopBar";

export const SyncerLayout = () => {
  const isSynced = useGlobalStore((state) => state.isSynced);
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);

  return (
    <div>
      {/* Sync Status overlay */}
      <TopBar />

      {/* Main dashboard only visible when synced and not loading */}
      {isSynced && !isLoadingAudio && <Dashboard />}
    </div>
  );
};
