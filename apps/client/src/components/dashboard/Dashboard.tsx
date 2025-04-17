import { motion } from "framer-motion";
import { Queue } from "../Queue";
import { Player } from "../room/Player";
import { UserGrid } from "../room/UserGrid";
import { Left } from "./Left";

export const Dashboard = () => {
  return (
    <motion.div
      className="w-full h-full flex bg-neutral-950 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left sidebar */}
      <Left />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-900/50 to-neutral-950 backdrop-blur-sm">
        <div className="p-6 max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold mb-8">BeatSync</h1>

          <div className="p-4 bg-neutral-800/30 backdrop-blur-md rounded-xl border border-neutral-700/50 shadow-lg">
            <Player />
          </div>

          <Queue
            className="mt-8"
            onItemClick={(item) => console.log("Queue item clicked:", item)}
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
    </motion.div>
  );
};
