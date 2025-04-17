import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { UserGrid } from "../room/UserGrid";

interface RightProps {
  className?: string;
}

export const Right = ({ className }: RightProps) => {
  return (
    <motion.div
      className={cn(
        "w-full lg:w-80 lg:flex-shrink-0 border-l border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md flex flex-col pb-4 lg:pb-0 text-sm",
        className
      )}
    >
      <motion.div className="flex-1">
        <UserGrid />
      </motion.div>

      <motion.div className="flex flex-col gap-3 px-4 py-3 bg-neutral-800/30 rounded-lg mx-3 mb-3 text-neutral-400">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-neutral-300 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="text-xs font-medium text-neutral-300 mb-1">
              What is this?
            </h5>
            <p className="text-xs leading-relaxed">
              This grid simulates a spatial audio environment. The headphone
              icon (🎧) is a listening source. The circles represent other
              devices in the room.
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed pl-6">
          {
            "Drag the headphone icon around and hear how the volume changes on each device. Isn't it cool!"
          }
        </p>
      </motion.div>
    </motion.div>
  );
};
