import { cn } from "@/lib/utils";
import { UserGrid } from "../room/UserGrid";

interface RightProps {
  className?: string;
}

export const Right = ({ className }: RightProps) => {
  return (
    <div
      className={cn(
        "w-full md:w-80 md:flex-shrink-0 border-l border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md flex flex-col pb-4 md:pb-0 text-sm",
        className
      )}
    >
      <UserGrid />
      <div className="flex flex-col gap-2 p-4 text-neutral-400">
        <h5 className="text-xs font-medium underline">What is this?</h5>
        <p className="text-xs leading-relaxed">
          This grid simulates a spatial audio environment. The headphone icon
          (🎧) is a listening source. The circles represent other devices in the
          room.
        </p>
        <p className="text-xs leading-relaxed">
          {
            "Drag the headphone icon around and hear how the volume changes on each device. Isn't it cool!"
          }
        </p>
      </div>
    </div>
  );
};
