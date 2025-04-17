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
          className="flex flex-1 flex-col overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Main content area with sidebars - Made scrollable */}
          <div className="flex flex-1 overflow-y-auto flex-wrap md:flex-nowrap">
            {/* Left sidebar: Hidden on small screens, shown on medium and up */}
            <Left className="hidden md:flex" />
            {/* Main content: Takes full width on mobile, flex-1 on md+ */}
            <Main />
            {/* Right sidebar: Stacks on mobile, side-by-side on md+ */}
            <Right className="flex w-full md:w-80 md:flex-shrink-0" />
          </div>
          {/* Player fixed at bottom */}
          <Bottom />
        </motion.div>
      )}
    </div>
  );
};
