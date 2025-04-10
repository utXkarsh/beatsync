import { formatTime } from "@/lib/utils";
import { useGlobalStore } from "@/store/global";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";

export const Player = () => {
  const broadcastPlay = useGlobalStore((state) => state.broadcastPlay);
  const broadcastPause = useGlobalStore((state) => state.broadcastPause);
  const startSpatialAudio = useGlobalStore((state) => state.startSpatialAudio);
  const stopSpatialAudio = useGlobalStore((state) => state.stopSpatialAudio);
  const isPlaying = useGlobalStore((state) => state.isPlaying);
  const getCurrentTrackPosition = useGlobalStore(
    (state) => state.getCurrentTrackPosition
  );
  const selectedAudioId = useGlobalStore((state) => state.selectedAudioId);
  const audioSources = useGlobalStore((state) => state.audioSources);

  // Local state for slider
  const [sliderPosition, setSliderPosition] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);

  // Find the selected audio source and its duration
  useEffect(() => {
    if (!selectedAudioId) return;

    const audioSource = audioSources.find(
      (source) => source.id === selectedAudioId
    );
    if (audioSource?.audioBuffer) {
      setTrackDuration(audioSource.audioBuffer.duration);
    }
  }, [selectedAudioId, audioSources]);

  // Update slider position during playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentPosition = getCurrentTrackPosition();
      setSliderPosition(currentPosition);
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isPlaying, getCurrentTrackPosition]);

  // Handle slider change
  const handleSliderChange = useCallback((value: number[]) => {
    const position = value[0];
    setSliderPosition(position);
  }, []);

  // Handle slider release - seek to that position
  const handleSliderCommit = useCallback(
    (value: number[]) => {
      const position = value[0];
      if (isPlaying) {
        broadcastPause();
        setTimeout(() => {
          broadcastPlay(position);
        }, 100);
      } else {
        // Just update position for next play
        setSliderPosition(position);
      }
    },
    [isPlaying, broadcastPause, broadcastPlay]
  );

  return (
    <div className="space-y-4">
      <div className="w-full">
        <Slider
          value={[sliderPosition]}
          min={0}
          max={trackDuration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderCommit}
          className="my-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(sliderPosition)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => broadcastPlay(sliderPosition)}
          variant={isPlaying ? "secondary" : "default"}
          disabled={!selectedAudioId}
        >
          {isPlaying ? "Restart" : "Play"}
        </Button>
        <Button
          onClick={broadcastPause}
          variant="outline"
          disabled={!isPlaying || !selectedAudioId}
        >
          Pause
        </Button>
        <Button
          onClick={startSpatialAudio}
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          Start Spatial Audio
        </Button>
        <Button onClick={stopSpatialAudio} variant="outline" size="sm">
          Stop Spatial Audio
        </Button>
      </div>
    </div>
  );
};
