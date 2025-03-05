"use client";
import { Button } from "@/components/ui/button";
import {
  Action,
  ClientMessage,
  NTPRequestMessage,
  NTPResponseMessage,
  ServerMessage,
} from "@shared/types";
import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import LocalIPFinder from "./IPFinder";

const deserializeMessage = (message: string): ServerMessage => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};

const serializeMessage = (message: ClientMessage): string => {
  return JSON.stringify(message);
};

interface NTPMeasurement {
  t0: number;
  t1: number;
  t2: number;
  t3: number;
  roundTripDelay: number;
  clockOffset: number;
}

export const Syncer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ntpMeasurements, setNtpMeasurements] = useState<NTPMeasurement[]>([]);
  const [averageRoundTrip, setAverageRoundTrip] = useState<number | null>(null);

  // This is the amount of time that the client is offset from the server
  const [averageOffset, setAverageOffset] = useState<number | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const measurementCountRef = useRef<number>(0);

  // Keep isMeasuring in a ref so the WebSocket callback always has the current value
  const isMeasuringRef = useRef(isMeasuring);
  useEffect(() => {
    isMeasuringRef.current = isMeasuring;
  }, [isMeasuring]);

  // Set up WebSocket connection - only once
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

        console.log("isMeasuring ", isMeasuringRef.current);
        console.log(
          "measurementCountRef.current ",
          measurementCountRef.current
        );

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
      } else if (message.type === Action.Play) {
        audioRef.current!.play();
      } else if (message.type === Action.Pause) {
        audioRef.current!.pause();
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    // Preload audio
    audioRef.current = new Audio("/chess.mp3");

    return () => {
      ws.close();
    };
  }, []); // Empty dependency array - only run once on mount

  // Calculate averages when measurements change
  useEffect(() => {
    if (ntpMeasurements.length === 0) return;

    // If we've completed all measurements, calculate the averages
    if (ntpMeasurements.length === 20) {
      calculateAverages();
    }
  }, [ntpMeasurements]);

  const calculateAverages = () => {
    if (ntpMeasurements.length === 0) return;

    const totalRoundTrip = ntpMeasurements.reduce(
      (sum, m) => sum + m.roundTripDelay,
      0
    );
    const totalOffset = ntpMeasurements.reduce(
      (sum, m) => sum + m.clockOffset,
      0
    );

    setAverageRoundTrip(totalRoundTrip / ntpMeasurements.length);
    setAverageOffset(totalOffset / ntpMeasurements.length);
  };

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
    setAverageRoundTrip(null);
    setAverageOffset(null);
    measurementCountRef.current = 1;

    // Start the measurement process
    sendNTPRequest();
  }, [sendNTPRequest]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <LocalIPFinder />
      <div className="mt-4 mb-4">
        Status: {isConnected ? "Connected" : "Disconnected"}
      </div>
      <div className="flex gap-2">
        <Button onClick={handlePlay} variant="default" size="default">
          <Play className="mr-2 h-4 w-4" />
          Play
        </Button>
        <Button onClick={handlePause} variant="default" size="default">
          <Pause className="mr-2 h-4 w-4" />
          Pause
        </Button>
      </div>
      <Button
        onClick={handleSendNTPMessage}
        className="mt-4"
        disabled={isMeasuring || !isConnected}
      >
        {isMeasuring ? "Measuring..." : "Run NTP Measurements (20x)"}
      </Button>

      {ntpMeasurements.length > 0 && (
        <div className="mt-4 p-4 border rounded max-w-md w-full">
          <h3 className="font-bold">NTP Measurements</h3>
          <p>Measurements: {ntpMeasurements.length}</p>
          {averageRoundTrip !== null && (
            <p>Average Round-trip Delay: {averageRoundTrip.toFixed(2)}ms</p>
          )}
          {averageOffset !== null && (
            <p>Average Clock Offset: {averageOffset.toFixed(2)}ms</p>
          )}
        </div>
      )}
    </div>
  );
};
