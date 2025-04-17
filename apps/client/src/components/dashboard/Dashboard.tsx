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
    <div className="w-full h-screen flex flex-col text-white bg-neutral-950 overflow-hidden">
      {/* Top sync status bar */}
      <TopBar />

      {isReady && (
        <motion.div
          className="w-full flex flex-1 flex-col bg-neutral-950 text-white overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Main content area with sidebars */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar: Hidden on small screens, shown on medium and up */}
            <Left className="hidden md:flex" />
            {/* Main content: Takes full width on small screens */}
            <Main />
            {/* Right sidebar: Hidden on small screens, shown on medium and up */}
            {/* Consider if Right sidebar is needed or should be lg:flex */}
            <Right className="hidden md:flex" />
          </div>
          {/* Player fixed at bottom */}
          <Bottom />
        </motion.div>
      )}
    </div>
  );
};
