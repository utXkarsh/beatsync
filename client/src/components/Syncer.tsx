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

// Helper function to calculate wait time for synchronized actions
const calculateWaitTime = (
  targetServerTime: number,
  clockOffset: number | null
): number => {
  // Calculate the current server time based on our local time and clock offset
  const estimatedCurrentServerTime = Date.now() + (clockOffset || 0);

  // Calculate how long to wait before executing the action
  // If waitTime is negative, we're already past the target time, so execute immediately
  return Math.max(0, targetServerTime - estimatedCurrentServerTime);
};

export const Syncer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const [ntpMeasurements, setNtpMeasurements] = useState<NTPMeasurement[]>([]);
  const [averageRoundTrip, setAverageRoundTrip] = useState<number | null>(null);
  const [scheduledAction, setScheduledAction] = useState<{
    type: Action;
    time: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loadingState, setLoadingState] = useState<
    "loading" | "ready" | "error"
  >("loading");

  // This is the amount of time that the client is offset from the server
  const [averageOffset, setAverageOffset] = useState<number | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const measurementCountRef = useRef<number>(0);
  const periodicNtpTimerRef = useRef<number | null>(null);

  // References for the latest values to use in callbacks
  const averageOffsetRef = useRef<number | null>(null);
  useEffect(() => {
    averageOffsetRef.current = averageOffset;
  }, [averageOffset]);

  // Initialize Audio Context and load audio
  useEffect(() => {
    // Create Audio Context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    audioContextRef.current = context;

    // Load and decode audio file
    const loadAudio = async () => {
      try {
        setLoadingState("loading");
        const response = await fetch("/chess.mp3");
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;
        setLoadingState("ready");
        console.log("Audio decoded and ready for precise playback");
      } catch (error) {
        console.error("Failed to load audio:", error);
        setLoadingState("error");
      }
    };

    loadAudio();

    return () => {
      if (context && context.state !== "closed") {
        context.close();
      }
    };
  }, []);

  // Keep isMeasuring in a ref so the WebSocket callback always has the current value
  const isMeasuringRef = useRef(isMeasuring);
  useEffect(() => {
    isMeasuringRef.current = isMeasuring;
  }, [isMeasuring]);

  // Set up continuous NTP measurements to prevent clock drift
  useEffect(() => {
    if (isConnected) {
      // Initial measurement when connected
      handleSendNTPMessage();

      // Then schedule periodic remeasurements every 30 seconds
      periodicNtpTimerRef.current = window.setInterval(() => {
        console.log("Performing periodic NTP measurement");
        handleSendNTPMessage();
      }, 30000);
    }

    return () => {
      if (periodicNtpTimerRef.current) {
        clearInterval(periodicNtpTimerRef.current);
      }
    };
  }, [isConnected]);

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

        // Convert server time to audio context time for precise scheduling
        const audioContext = audioContextRef.current;
        if (!audioContext || !audioBufferRef.current) {
          console.error("Audio not ready yet");
          return;
        }

        // Calculate wait time using helper function
        const waitTime = calculateWaitTime(
          targetServerTime,
          averageOffsetRef.current
        );
        console.log(`Scheduling ${message.type} to happen in ${waitTime}ms`);

        // Calculate the exact audio context time to start/stop playback
        const audioContextTime = audioContext.currentTime + waitTime / 1000;

        // Update UI to show scheduled action
        setScheduledAction({
          type: message.type,
          time: Date.now() + waitTime,
        });

        if (message.type === Action.Play) {
          // Stop current source if any
          if (audioSourceRef.current) {
            try {
              audioSourceRef.current.stop();
            } catch (e) {
              // Ignore if already stopped
            }
          }

          // Create new audio source node
          const source = audioContext.createBufferSource();
          source.buffer = audioBufferRef.current;
          source.connect(audioContext.destination);
          audioSourceRef.current = source;

          // Calculate where to start playing from
          let offset = 0;
          if (pausedAtRef.current !== null) {
            offset = pausedAtRef.current;
            pausedAtRef.current = null;
          } else if (message.serverTime < targetServerTime) {
            // If we're joining late and the audio should already be playing,
            // calculate how far into the audio we should start
            const elapsedServerTime =
              (Date.now() +
                (averageOffsetRef.current || 0) -
                targetServerTime) /
              1000;
            offset = Math.max(0, elapsedServerTime);
            console.log(`Late join - starting ${offset}s into audio`);
          }

          // Schedule precise playback
          startedAtRef.current = audioContextTime - offset;
          console.log(
            `Starting playback at context time ${audioContextTime}, offset ${offset}`
          );
          source.start(audioContextTime, offset);

          // Log when playback actually starts
          setTimeout(() => {
            console.log("Play scheduled to start at:", audioContextTime);
            console.log("Actual context time now:", audioContext.currentTime);
          }, waitTime);
        } else if (message.type === Action.Pause) {
          if (audioSourceRef.current && startedAtRef.current !== null) {
            try {
              // Schedule the stop
              audioSourceRef.current.stop(audioContextTime);

              // Calculate where we'll be in the audio when we pause
              const pausePosition = audioContextTime - startedAtRef.current;
              pausedAtRef.current = pausePosition;
              startedAtRef.current = null;

              console.log(`Pausing at position ${pausePosition}s`);

              // Log when playback actually stops
              setTimeout(() => {
                console.log("Pause scheduled at:", audioContextTime);
                console.log(
                  "Actual context time now:",
                  audioContext.currentTime
                );
              }, waitTime);
            } catch (e) {
              console.error("Error pausing:", e);
            }
          }
        }

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

    // Sort measurements by round trip delay and take the best 50% for offset calculation
    // This helps filter out network jitter
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
    // Keep the existing offset until we have new measurements
    measurementCountRef.current = 1;

    // Start the measurement process
    sendNTPRequest();
  }, [sendNTPRequest]);

  // Update countdown timer for scheduled action
  useEffect(() => {
    if (!scheduledAction) {
      setCountdown(null);
      return;
    }

    // Initial countdown
    setCountdown(Math.max(0, scheduledAction.time - Date.now()));

    // Update countdown every 10ms
    const intervalId = setInterval(() => {
      const remaining = Math.max(0, scheduledAction.time - Date.now());
      setCountdown(remaining);

      // Clear interval if countdown reaches 0
      if (remaining === 0) {
        clearInterval(intervalId);
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [scheduledAction]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <LocalIPFinder />
      <div className="mt-4 mb-4">
        Status: {isConnected ? "Connected" : "Disconnected"}, Audio:{" "}
        {loadingState === "ready"
          ? "Ready"
          : loadingState === "loading"
          ? "Loading..."
          : "Error!"}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handlePlay}
          variant="default"
          size="default"
          disabled={loadingState !== "ready"}
        >
          <Play className="mr-2 h-4 w-4" />
          Play
        </Button>
        <Button
          onClick={handlePause}
          variant="default"
          size="default"
          disabled={loadingState !== "ready"}
        >
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

      {scheduledAction && (
        <div className="mt-4 p-4 border rounded max-w-md w-full bg-yellow-50">
          <h3 className="font-bold">Scheduled Action</h3>
          <p>Action: {scheduledAction.type}</p>
          <p>
            Scheduled at: {new Date(scheduledAction.time).toLocaleTimeString()}
          </p>
          {countdown !== null && (
            <p className="font-bold text-lg">
              Executing in: {(countdown / 1000).toFixed(2)}s
            </p>
          )}
        </div>
      )}

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
