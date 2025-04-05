import { useGlobalStore } from "@/store/global";
import { Button } from "../ui/button";

export const Player = () => {
  const broadcastPlay = useGlobalStore((state) => state.broadcastPlay);
  const broadcastPause = useGlobalStore((state) => state.broadcastPause);
  const startSpatialAudio = useGlobalStore((state) => state.startSpatialAudio);

  return (
    <div>
      <Button onClick={() => broadcastPlay()}>Play</Button>
      <Button onClick={broadcastPause}>Pause</Button>
      <Button onClick={startSpatialAudio}>Start Spatial Audio</Button>
    </div>
  );
};
