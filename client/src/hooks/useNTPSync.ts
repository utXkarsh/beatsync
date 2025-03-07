import { serializeMessage } from "@/utils/websocket";
import { Action, NTPRequestMessage } from "@shared/types";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

interface NTPMeasurement {
  t0: number;
  t1: number;
  t2: number;
  t3: number;
  roundTripDelay: number;
  clockOffset: number;
}

export const useNTPSync = (socketRef: RefObject<WebSocket | null>) => {
  const [ntpMeasurements, setNtpMeasurements] = useState<NTPMeasurement[]>([]);
  const [averageRoundTrip, setAverageRoundTrip] = useState<number | null>(null);
  const [averageOffset, setAverageOffset] = useState<number | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const measurementCountRef = useRef(0);
  const isMeasuringRef = useRef(false);

  // Keep isMeasuring in a ref so the WebSocket callback always has the current value
  useEffect(() => {
    isMeasuringRef.current = isMeasuring;
  }, [isMeasuring]);

  const calculateAverages = useCallback(() => {
    // Sort measurements by round trip delay to find the best ones
    const sortedMeasurements = [...ntpMeasurements].sort(
      (a, b) => a.roundTripDelay - b.roundTripDelay
    );
    const bestMeasurements = sortedMeasurements.slice(
      0,
      Math.ceil(sortedMeasurements.length / 2)
    );

    // Calculate average round trip from all measurements
    const totalRoundTrip = ntpMeasurements.reduce(
      (sum, m) => sum + m.roundTripDelay,
      0
    );

    // But only use the best measurements for offset calculation
    const totalOffset = bestMeasurements.reduce(
      (sum, m) => sum + m.clockOffset,
      0
    );

    setAverageRoundTrip(totalRoundTrip / ntpMeasurements.length);
    setAverageOffset(totalOffset / bestMeasurements.length);

    console.log(
      "New clock offset calculated:",
      totalOffset / bestMeasurements.length
    );
  }, [ntpMeasurements]);

  const sendNTPRequest = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const t0 = Date.now();
      const ntpRequest: NTPRequestMessage = {
        type: Action.NTPRequest,
        t0,
      };
      socketRef.current.send(serializeMessage(ntpRequest));
    }
  }, [socketRef]);

  const handleSendNTPMessage = useCallback(() => {
    setIsMeasuring(true);
    setNtpMeasurements([]);
    measurementCountRef.current = 1;
    sendNTPRequest();
  }, [sendNTPRequest]);

  // Calculate averages when measurements change
  useEffect(() => {
    if (ntpMeasurements.length === 0) return;
    if (ntpMeasurements.length === 20) {
      calculateAverages();
    }
  }, [ntpMeasurements, calculateAverages]);

  const handleNTPResponse = useCallback(
    (t1: number, t2: number) => {
      const t3 = Date.now();
      const t0 = ntpMeasurements[ntpMeasurements.length - 1]?.t0 || Date.now();

      // Calculate round-trip delay and clock offset
      const roundTripDelay = t3 - t0 - (t2 - t1);
      const clockOffset = (t1 - t0 + (t2 - t3)) / 2;

      const measurement: NTPMeasurement = {
        t0,
        t1,
        t2,
        t3,
        roundTripDelay,
        clockOffset,
      };

      setNtpMeasurements((prev) => [...prev, measurement]);

      // If we're in the middle of a measurement batch, continue
      if (isMeasuringRef.current && measurementCountRef.current < 20) {
        measurementCountRef.current++;
        setTimeout(() => {
          sendNTPRequest();
        }, 30);
      }

      // If we've completed 20 measurements, set measuring to false
      if (measurementCountRef.current >= 20) {
        setIsMeasuring(false);
      }
    },
    [sendNTPRequest, ntpMeasurements]
  );

  return {
    ntpMeasurements,
    averageRoundTrip,
    averageOffset,
    isMeasuring,
    handleSendNTPMessage,
    handleNTPResponse,
  };
};
