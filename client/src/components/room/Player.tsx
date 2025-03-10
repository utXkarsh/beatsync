import { useGlobalStore } from "@/store/global";
import { Button } from "../ui/button";

export const Player = () => {
  const play = useGlobalStore((state) => state.play);
  const pause = useGlobalStore((state) => state.pause);

  return (
    <div>
      <Button onClick={play}>Play</Button>
      <Button onClick={pause}>Pause</Button>
    </div>
  );
};
