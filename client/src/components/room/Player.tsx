import { useGlobalStore } from "@/store/global";
import { Button } from "../ui/button";

export const Player = () => {
  const play = useGlobalStore((state) => state.play);
  const pause = useGlobalStore((state) => state.pause);

  return (
    <div>
      <Button onClick={() => play({ offset: 0, time: 0 })}>Play</Button>
      <Button onClick={pause}>Pause</Button>
    </div>
  );
};
