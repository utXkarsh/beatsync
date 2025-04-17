import { Player } from "../room/Player";

export const Bottom = () => {
  return (
    <div className="flex-shrink-0 border-t border-neutral-800/50 bg-neutral-950 backdrop-blur-md p-4">
      <div className="max-w-3xl mx-auto">
        <Player />
      </div>
    </div>
  );
};
