"use client";

import { useAudio } from "@/hooks/useAudio";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Action } from "@shared/types";
import { useCallback } from "react";
import { AudioControls } from "./AudioControls";
import LocalIPFinder from "./IPFinder";
import { NTPMeasurementDisplay } from "./NTPMeasurementDisplay";
import { NudgeControls } from "./NudgeControls";
import { ScheduledActionDisplay } from "./ScheduledActionDisplay";
import { TimingDisplay } from "./TimingDisplay";

export const Syncer = () => {
  // Initialize audio hook
  const {
    loadingState,
    selectedTrack,
    isMuted,
    isPlaying,
    currentPlaybackTime,
    totalNudge,
    nudgeAmount,
    handleScheduledAction,
    handleNudgeForward,
    handleNudgeBackward,
    handleNudgeAmountChange,
    handleToggleMute,
    handleTrackChange,
  } = useAudio();

  // Initialize WebSocket hook with callback for scheduled actions
  const {
    isConnected,
    ntpMeasurements,
    averageRoundTrip,
    averageOffset,
    scheduledAction,
    isMeasuring,
    handleSendNTPMessage,
    handlePlay,
    handlePause,
  } = useWebSocket({
    onScheduleAction: useCallback(
      (
        action: Action,
        targetServerTime: number,
        waitTime: number,
        offset?: number
      ) => {
        handleScheduledAction(action, targetServerTime, waitTime, offset);
      },
      [handleScheduledAction]
    ),
  });

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

      {/* Audio controls */}
      <AudioControls
        isMuted={isMuted}
        loadingState={loadingState}
        selectedTrack={selectedTrack}
        onPlay={handlePlay}
        onPause={handlePause}
        onToggleMute={handleToggleMute}
        onTrackChange={handleTrackChange}
      />

      {/* Nudge controls */}
      <NudgeControls
        nudgeAmount={nudgeAmount}
        totalNudge={totalNudge}
        onNudgeForward={handleNudgeForward}
        onNudgeBackward={handleNudgeBackward}
        onNudgeAmountChange={handleNudgeAmountChange}
        isPlaying={isPlaying}
      />

      {/* Timing display */}
      <TimingDisplay
        currentTime={currentPlaybackTime}
        isPlaying={isPlaying}
        totalNudge={totalNudge}
        clockOffset={averageOffset}
      />

      {/* NTP measurement controls */}
      <NTPMeasurementDisplay
        ntpMeasurements={ntpMeasurements}
        averageRoundTrip={averageRoundTrip}
        averageOffset={averageOffset}
        isMeasuring={isMeasuring}
        onMeasure={handleSendNTPMessage}
        isConnected={isConnected}
      />

      {/* Scheduled action display */}
      <ScheduledActionDisplay scheduledAction={scheduledAction} />
    </div>
  );
};
