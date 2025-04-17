import { Queue } from "../Queue";

export const Main = () => {
  return (
    <div className="w-full md:flex-1 overflow-y-auto bg-gradient-to-b from-neutral-900/50 to-neutral-950 backdrop-blur-xl">
      <div className="p-6 pt-4">
        {/* <h1 className="text-xl font-semibold mb-8">BeatSync</h1> */}
        <Queue className="mb-8" />
      </div>
    </div>
  );
};
