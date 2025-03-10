import { useGlobalStore } from "@/store/global";
import { Button } from "../ui/button";

export const Player = () => {
  const broadcastPlay = useGlobalStore((state) => state.broadcastPlay);
  const broadcastPause = useGlobalStore((state) => state.broadcastPause);

  return (
    <div>
      <Button onClick={() => broadcastPlay()}>Play</Button>
      <Button onClick={broadcastPause}>Pause</Button>
    </div>
  );
};
