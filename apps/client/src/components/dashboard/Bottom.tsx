import { useGlobalStore } from "@/store/global";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Player } from "../room/Player";

export const Bottom = () => {
  const getCurrentGainValue = useGlobalStore(
    (state) => state.getCurrentGainValue
  );
  const isSpatialAudioEnabled = useGlobalStore(
    (state) => state.isSpatialAudioEnabled
  );
  const [gainValue, setGainValue] = useState(1);

  // Update gain value every 50ms for smoother animation
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentGain = getCurrentGainValue();
      setGainValue(currentGain);
    }, 50);

    return () => clearInterval(intervalId);
  }, [getCurrentGainValue]);

  // Calculate bar width as percentage (max gain is typically 1)
  // Limit to 94% to maintain visible border radius at max gain
  const barWidthPercent = Math.min(94, Math.max(0, gainValue * 94));

  // Get color based on gain value using smooth interpolation
  const getColor = () => {
    if (gainValue >= 0.8) return "#10b981"; // emerald-500
    if (gainValue >= 0.5) return "#3b82f6"; // blue-500
    if (gainValue >= 0.2) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  return (
    <motion.div className="flex-shrink-0 border-t border-neutral-800/50 bg-neutral-900/10 backdrop-blur-lg p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] z-10 relative">
      <div className="max-w-3xl mx-auto">
        <Player />
      </div>
      <div className="absolute bottom-4 right-4 hidden lg:flex items-center gap-2">
        <div className="text-xs font-mono text-neutral-400">
          {gainValue.toFixed(2)}
        </div>

        {/* Visual gain meter */}
        <div className="relative h-4 w-24 bg-neutral-800/60 rounded-full overflow-hidden flex items-center">
          <motion.div
            className="absolute h-2 rounded-full ml-1"
            initial={{ width: 0 }}
            animate={{
              width: `${barWidthPercent}%`,
              opacity: isSpatialAudioEnabled ? 1 : 0.5,
              backgroundColor: getColor(),
            }}
            transition={{
              duration: 0.05,
              type: "tween",
              backgroundColor: { duration: 0.2 },
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};
