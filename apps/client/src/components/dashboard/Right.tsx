import { cn } from "@/lib/utils";
import { UserGrid } from "../room/UserGrid";

interface RightProps {
  className?: string;
}

export const Right = ({ className }: RightProps) => {
  return (
    <div
      className={cn(
        "w-full md:w-80 md:flex-shrink-0 border-l border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md flex flex-col pb-4 md:pb-0 md:h-full text-sm",
        className
      )}
    >
      <UserGrid />
    </div>
  );
};
