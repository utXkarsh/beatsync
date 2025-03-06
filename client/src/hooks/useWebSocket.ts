import { NTPMeasurement, ScheduledAction } from "@/types/audio";
import { calculateWaitTime } from "@/utils/time";
import { deserializeMessage, serializeMessage } from "@/utils/websocket";
import { Action, NTPRequestMessage, NTPResponseMessage } from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebSocketProps {
  onScheduleAction: (
    action: Action,
    targetServerTime: number,
    audioContextTime: number,
    offset?: number
  ) => void;
}

export const useWebSocket = ({ onScheduleAction }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [ntpMeasurements, setNtpMeasurements] = useState<NTPMeasurement[]>([]);
  const [averageRoundTrip, setAverageRoundTrip] = useState<number | null>(null);
  const [averageOffset, setAverageOffset] = useState<number | null>(null);
  const averageOffsetRef = useRef<number | null>(null);
  const [scheduledAction, setScheduledAction] =
    useState<ScheduledAction | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const measurementCountRef = useRef(0);
  const isMeasuringRef = useRef(false);

  // Keep averageOffset in a ref for use in callbacks
  useEffect(() => {
    averageOffsetRef.current = averageOffset;
  }, [averageOffset]);

  // Keep isMeasuring in a ref for WebSocket callback
  useEffect(() => {
    isMeasuringRef.current = isMeasuring;
  }, [isMeasuring]);

  // Calculate averages from NTP measurements
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

  // Calculate averages when measurements change
  useEffect(() => {
    if (ntpMeasurements.length === 0) return;

    // If we've completed all measurements, calculate the averages
    if (ntpMeasurements.length === 20) {
      calculateAverages();
    }
  }, [ntpMeasurements, calculateAverages]);

  // Set up WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = deserializeMessage(event.data);
      console.log("Message from server ", message);

      if (message.type === Action.NTPResponse) {
        const t3 = Date.now();
        const ntpResponse = message as NTPResponseMessage;
        const { t0, t1, t2 } = ntpResponse;

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

        console.log("Measurement ", measurement);

        setNtpMeasurements((prev) => [...prev, measurement]);

        // If we're in the middle of a measurement batch, continue
        if (isMeasuringRef.current && measurementCountRef.current < 20) {
          console.log("Sending NTP request ", measurementCountRef.current);
          measurementCountRef.current++;
          setTimeout(() => {
            sendNTPRequest();
          }, 30);
        }

        // If we've completed 20 measurements, set measuring to false
        if (measurementCountRef.current >= 20) {
          setIsMeasuring(false);
        }
      } else if (
        message.type === Action.Play ||
        message.type === Action.Pause
      ) {
        // Get the server's intended execution time
        const targetServerTime = message.timestamp;

        // Calculate wait time using helper function
        const waitTime = calculateWaitTime(
          targetServerTime,
          averageOffsetRef.current
        );
        console.log(`Scheduling ${message.type} to happen in ${waitTime}ms`);

        // Update UI to show scheduled action
        setScheduledAction({
          type: message.type,
          time: Date.now() + waitTime,
        });

        // Call the provided callback to handle the action
        onScheduleAction(
          message.type,
          targetServerTime,
          waitTime,
          message.type === Action.Play && message.serverTime < targetServerTime
            ? (Date.now() +
                (averageOffsetRef.current || 0) -
                targetServerTime) /
                1000
            : undefined
        );

        // Clear scheduled action after a bit longer than the wait time
        setTimeout(() => {
          setScheduledAction(null);
        }, waitTime + 100);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [onScheduleAction]);

  // Set up continuous NTP measurements to prevent clock drift
  useEffect(() => {
    if (isConnected) {
      // Initial measurement when connected
      handleSendNTPMessage();

      // Then schedule periodic remeasurements every 30 seconds
      const intervalId = setInterval(() => {
        handleSendNTPMessage();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [isConnected]);

  const sendNTPRequest = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const t0 = Date.now();
      const ntpRequest: NTPRequestMessage = {
        type: Action.NTPRequest,
        t0,
      };
      socketRef.current.send(JSON.stringify(ntpRequest));
    }
  }, []);

  const handleSendNTPMessage = useCallback(() => {
    setIsMeasuring(true);
    // Reset measurements
    setNtpMeasurements([]);
    // Keep the existing offset until we have new measurements
    measurementCountRef.current = 1;

    // Start the measurement process
    sendNTPRequest();
  }, [sendNTPRequest]);

  const handlePlay = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(serializeMessage({ type: Action.Play }));
    }
  }, []);

  const handlePause = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(serializeMessage({ type: Action.Pause }));
    }
  }, []);

  return {
    isConnected,
    ntpMeasurements,
    averageRoundTrip,
    averageOffset,
    scheduledAction,
    isMeasuring,
    handleSendNTPMessage,
    handlePlay,
    handlePause,
  };
};
