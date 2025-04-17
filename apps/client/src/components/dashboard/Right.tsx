import { UserGrid } from "../room/UserGrid";

export const Right = () => {
  return (
    <div className="w-80 flex-shrink-0 border-r border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md flex flex-col h-full text-sm">
      <UserGrid />
    </div>
  );
};
