"use client";

import { useGlobalStore } from "@/store/global";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export const AudioControls = () => {
  const startSpatialAudio = useGlobalStore((state) => state.startSpatialAudio);
  const stopSpatialAudio = useGlobalStore((state) => state.stopSpatialAudio);

  const handleStartSpatialAudio = () => {
    startSpatialAudio();
    toast.success("Circular spatial audio started");
  };

  const handleStopSpatialAudio = () => {
    stopSpatialAudio();
    toast.info("Circular spatial audio stopped");
  };

  return (
    <motion.div className="px-4 space-y-3 py-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        Audio Controls
      </h2>

      <div className="space-y-3">
        <motion.div className="bg-neutral-800/20 rounded-md p-3 hover:bg-neutral-800/30 transition-colors">
          <div className="flex justify-between items-center">
            <div className="text-xs text-neutral-300 flex items-center gap-1.5">
              <RotateCcw className="h-3 w-3 text-primary-500" />
              <span>Spatial Audio</span>
            </div>
            <div className="flex gap-2">
              <Button
                className="text-xs px-3 py-1 h-auto bg-primary-600/80 hover:bg-primary-600 text-white"
                size="sm"
                onClick={handleStartSpatialAudio}
              >
                Start
              </Button>
              <Button
                className="text-xs px-3 py-1 h-auto bg-neutral-700/60 hover:bg-neutral-700 text-white"
                size="sm"
                onClick={handleStopSpatialAudio}
              >
                Stop
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
