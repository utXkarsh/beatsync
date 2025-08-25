"use client";

import { useGlobalStore, useCanMutate } from "@/store/global";
import React from "react";
import { Orbit, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { usePostHog } from "posthog-js/react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const AudioControls = () => {
  const posthog = usePostHog();
  const canMutate = useCanMutate();
  const startSpatialAudio = useGlobalStore((state) => state.startSpatialAudio);
  const stopSpatialAudio = useGlobalStore(
    (state) => state.sendStopSpatialAudio,
  );
  const isLoadingAudio = useGlobalStore((state) => state.isInitingSystem);

  const [effectType, setEffectType] = React.useState<"rotation" | "infinity">(
    "rotation",
  );

  const handleStartSpatialAudio = () => {
    if (!canMutate) return;
    startSpatialAudio(effectType);
    posthog.capture("start_spatial_audio", { effectType });
  };

  const handleStopSpatialAudio = () => {
    if (!canMutate) return;
    stopSpatialAudio();
    posthog.capture("stop_spatial_audio");
  };

  return (
    <motion.div className="px-4 space-y-2 py-3 mt-1">
      <div className="flex items-center gap-2 font-medium">
        <Sparkles size={18} />
        <span>Audio Effects</span>
      </div>
      <div className="space-y-2">
        {/* Rotation Effect */}
        <motion.div
          className={cn(
            "bg-neutral-800/20 rounded-md p-3 hover:bg-neutral-800/30 transition-colors",
            !canMutate && "opacity-50",
          )}
        >
          <div className="flex justify-between items-center">
            <div className="text-xs text-neutral-300 flex items-center gap-1.5">
              <Orbit className="h-3 w-3 text-primary-500" />
              <span>Rotation</span>
              <input
                type="radio"
                name="effectType"
                value="rotation"
                checked={effectType === "rotation"}
                onChange={() => setEffectType("rotation")}
                className="ml-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="text-xs px-3 py-1 h-auto bg-primary-600/80 hover:bg-primary-600 text-white"
                size="sm"
                onClick={handleStartSpatialAudio}
                disabled={isLoadingAudio || !canMutate}
              >
                Start
              </Button>
              <Button
                className="text-xs px-3 py-1 h-auto bg-neutral-700/60 hover:bg-neutral-700 text-white"
                size="sm"
                onClick={handleStopSpatialAudio}
                disabled={isLoadingAudio || !canMutate}
              >
                Stop
              </Button>
            </div>
          </div>
        </motion.div>
        {/* Infinity Effect */}
        <motion.div
          className={cn(
            "bg-neutral-800/20 rounded-md p-3 hover:bg-neutral-800/30 transition-colors",
            !canMutate && "opacity-50",
          )}
        >
          <div className="flex justify-between items-center">
            <div className="text-xs text-neutral-300 flex items-center gap-1.5">
              <Orbit className="h-3 w-3 text-primary-500 rotate-45" />
              <span>Infinity</span>
              <input
                type="radio"
                name="effectType"
                value="infinity"
                checked={effectType === "infinity"}
                onChange={() => setEffectType("infinity")}
                className="ml-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="text-xs px-3 py-1 h-auto bg-primary-600/80 hover:bg-primary-600 text-white"
                size="sm"
                onClick={handleStartSpatialAudio}
                disabled={isLoadingAudio || !canMutate}
              >
                Start
              </Button>
              <Button
                className="text-xs px-3 py-1 h-auto bg-neutral-700/60 hover:bg-neutral-700 text-white"
                size="sm"
                onClick={handleStopSpatialAudio}
                disabled={isLoadingAudio || !canMutate}
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
