import { useGlobalStore } from "@/store/global";
import { motion } from "framer-motion";
import { Queue } from "../Queue";
import { Player } from "../room/Player";
import { SyncStatus } from "../room/SyncStatus";
import { UserGrid } from "../room/UserGrid";
import { Left } from "./Left";

export const Dashboard = () => {
  const isSynced = useGlobalStore((state) => state.isSynced);
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);

  const isReady = isSynced && !isLoadingAudio;

  return (
    <div className="w-full h-screen flex flex-col text-white bg-neutral-950">
      {/* Top sync status bar */}
      <SyncStatus />

      {isReady && (
        <motion.div
          className="w-full h-full flex flex-col bg-neutral-950 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Main content area with sidebars */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar */}
            <Left />
            {/* Main content */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-900/50 to-neutral-950 backdrop-blur-sm">
              <div className="p-6 max-w-3xl mx-auto">
                <h1 className="text-xl font-semibold mb-8">BeatSync</h1>
                <Queue
                  className="mb-8"
                  onItemClick={(item) =>
                    console.log("Queue item clicked:", item)
                  }
                />
              </div>
            </div>
            {/* Right sidebar */}
            <div className="w-[280px] flex-shrink-0 border-l border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md overflow-y-auto">
              <div className="p-4">
                <h2 className="text-sm font-medium mb-3">Connected Users</h2>
                <UserGrid />
              </div>
            </div>
          </div>
          {/* Player fixed at bottom */}
          <div className="flex-shrink-0 border-t border-neutral-800/50 bg-neutral-900/80 backdrop-blur-md p-4">
            <div className="max-w-3xl mx-auto">
              <Player />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
