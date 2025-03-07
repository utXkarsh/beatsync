"use client";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/context/room";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useAudioSources } from "@/hooks/useAudioSources";
import { useNTPSync } from "@/hooks/useNTPSync";
import { calculateWaitTime } from "@/utils/time";
import { deserializeMessage } from "@/utils/websocket";
import { Action, NTPResponseMessage } from "@shared/types";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NudgeControls } from "./NudgeControls";
import { TimingDisplay } from "./TimingDisplay";
import { TrackSelector } from "./TrackSelector";

export const Syncer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { socketRef, setWebsocket, roomId, username, userId, isLoading } =
    useRoom();
  const [scheduledAction, setScheduledAction] = useState<{
    type: Action;
    time: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const { isLoadingAudioSources } = useAudioSources();
  const {
    ntpMeasurements,
    averageRoundTrip,
    averageOffset,
    isMeasuring,
    handleSendNTPMessage,
    handleNTPResponse,
  } = useNTPSync(socketRef);

  const {
    loadingState,
    isPlaying,
    isMuted,
    currentPlaybackTime,
    totalNudge,
    selectedSourceIndex,
    handlePlay,
    handlePause,
    handleNudge,
    handleToggleMute,
    handleTrackChange,
    handleServerAction,
  } = useAudioPlayback(socketRef, averageOffset); // depends on useNTPSync first

  // Set up WebSocket connection
  useEffect(() => {
    if (isLoading) return;

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?roomId=${roomId}&userId=${userId}&username=${username}`
    );
    setWebsocket(ws);

    ws.onopen = () => {
      console.log("Connected to WebSocket");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = deserializeMessage(event.data);
      console.log("Message from server ", message);

      if (message.type === Action.NTPResponse) {
        const ntpResponse = message as NTPResponseMessage;
        handleNTPResponse(ntpResponse.t1, ntpResponse.t2);
      } else if (
        message.type === Action.Play ||
        message.type === Action.Pause
      ) {
        const targetServerTime = message.timestamp;
        handleServerAction(message.type, targetServerTime);
        setScheduledAction({
          type: message.type,
          time: Date.now() + calculateWaitTime(targetServerTime, averageOffset),
        });
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [
    isLoading,
    roomId,
    userId,
    username,
    setWebsocket,
    handleNTPResponse,
    handleServerAction,
    averageOffset,
  ]);

  // Update countdown timer for scheduled action
  useEffect(() => {
    if (!scheduledAction) {
      setCountdown(null);
      return;
    }

    setCountdown(Math.max(0, scheduledAction.time - Date.now()));

    const intervalId = setInterval(() => {
      const remaining = Math.max(0, scheduledAction.time - Date.now());
      setCountdown(remaining);

      if (remaining === 0) {
        clearInterval(intervalId);
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [scheduledAction]);

  const router = useRouter();
  if (isLoading || isLoadingAudioSources) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/90">
        <div className="w-6 h-6 border-1 border-t-gray-800 rounded-full animate-spin"></div>
        <span className="ml-3 text-base font-normal text-gray-500">
          Loading{" "}
          {isLoading
            ? "room data"
            : isLoadingAudioSources
            ? "audio tracks"
            : ""}
          ...
        </span>
      </div>
    );
  }

  if (!roomId || !username || !userId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div>
          Room configured incorrectly. Missing:
          {!roomId && <span className="font-semibold"> roomId</span>}
          {!username && (
            <span className="font-semibold">{!roomId ? "," : ""} username</span>
          )}
          {!userId && (
            <span className="font-semibold">
              {!roomId || !username ? "," : ""} userId
            </span>
          )}
        </div>
        <Button onClick={() => router.push("/")} className="mt-2">
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <TrackSelector />

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
        <Button
          onClick={handleToggleMute}
          variant={isMuted ? "destructive" : "outline"}
          size="default"
          disabled={loadingState !== "ready"}
        >
          {isMuted ? (
            <VolumeX className="mr-2 h-4 w-4" />
          ) : (
            <Volume2 className="mr-2 h-4 w-4" />
          )}
          {isMuted ? "Unmute" : "Mute"}
        </Button>
      </div>

      <NudgeControls
        totalNudge={totalNudge}
        onNudge={handleNudge}
        disabled={loadingState !== "ready" || !isPlaying}
      />

      <TimingDisplay
        currentTime={currentPlaybackTime}
        isPlaying={isPlaying}
        totalNudge={totalNudge}
        clockOffset={averageOffset}
      />

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
