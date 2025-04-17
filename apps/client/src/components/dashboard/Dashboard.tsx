import { useGlobalStore } from "@/store/global";
import { motion } from "framer-motion";
import { TopBar } from "../room/TopBar";
import { Bottom } from "./Bottom";
import { Left } from "./Left";
import { Main } from "./Main";
import { Right } from "./Right";

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
            <Right />
          </div>
          {/* Player fixed at bottom */}
          <Bottom />
        </motion.div>
      )}
    </div>
  );
};
