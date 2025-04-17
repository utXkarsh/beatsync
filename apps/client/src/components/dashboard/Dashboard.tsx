import { useGlobalStore } from "@/store/global";
import { motion } from "framer-motion";
import { TopBar } from "../room/TopBar";
import { UserGrid } from "../room/UserGrid";
import { Bottom } from "./Bottom";
import { Left } from "./Left";
import { Main } from "./Main";

export const Dashboard = () => {
  const isSynced = useGlobalStore((state) => state.isSynced);
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);

  const isReady = isSynced && !isLoadingAudio;

  return (
    <div className="w-full h-screen flex flex-col text-white bg-neutral-950">
      {/* Top sync status bar */}
      <TopBar />

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
            <Main />
            {/* Right sidebar */}
            <div className="w-[280px] flex-shrink-0 border-l border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md overflow-y-auto">
              <div className="p-4">
                <h2 className="text-sm font-medium mb-3">Connected Users</h2>
                <UserGrid />
              </div>
            </div>
          </div>
          {/* Player fixed at bottom */}
          <Bottom />
        </motion.div>
      )}
    </div>
  );
};
