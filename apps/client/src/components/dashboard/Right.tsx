import { cn } from "@/lib/utils";
import { UserGrid } from "../room/UserGrid";

interface RightProps {
  className?: string;
}

export const Right = ({ className }: RightProps) => {
  return (
    <div
      className={cn(
        "w-80 flex-shrink-0 border-l border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md flex flex-col h-full text-sm",
        className
      )}
    >
      <UserGrid />
    </div>
  );
};
