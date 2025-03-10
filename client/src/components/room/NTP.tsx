import { useGlobalStore } from "@/store/global";
import { Button } from "../ui/button";

export const NTP = () => {
  const sendNTPRequest = useGlobalStore((state) => state.sendNTPRequest);
  const ntpMeasurements = useGlobalStore((state) => state.ntpMeasurements);

  return (
    <div>
      {ntpMeasurements.length > 0 && (
        <p>Synced {ntpMeasurements.length} times</p>
      )}
      <Button onClick={sendNTPRequest}>Sync</Button>
    </div>
  );
};
