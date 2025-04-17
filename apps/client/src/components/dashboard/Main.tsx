import { Queue } from "../Queue";

export const Main = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-900/50 to-neutral-950 backdrop-blur-sm">
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-8">BeatSync</h1>
        <Queue className="mb-8" />
      </div>
    </div>
  );
};
