import { formatTime } from "@/lib/utils";

import { useGlobalStore } from "@/store/global";
import {
  Pause,
  Play,
  RefreshCw,
  Repeat,
  RocketIcon,
  Shuffle,
  SkipBack,
  SkipForward,
  StopCircleIcon,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

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
  const currentTime = useGlobalStore((state) => state.currentTime);

  // Local state for slider
  const [sliderPosition, setSliderPosition] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [spatialAudioActive, setSpatialAudioActive] = useState(false);

  // Find the selected audio source and its duration
  useEffect(() => {
    if (!selectedAudioId) return;

    const audioSource = audioSources.find(
      (source) => source.id === selectedAudioId
    );
    if (audioSource?.audioBuffer) {
      setTrackDuration(audioSource.audioBuffer.duration);
      // Reset slider position when track changes
      setSliderPosition(0);
    }
  }, [selectedAudioId, audioSources]);

  // Sync with currentTime when it changes (e.g., after pausing)
  useEffect(() => {
    if (!isPlaying) {
      setSliderPosition(currentTime);
    }
  }, [currentTime, isPlaying]);

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
  const handleSliderCommit = (value: number[]) => {
    console.log(value);
  };

  const handleSpatialAudioToggle = () => {
    if (spatialAudioActive) {
      stopSpatialAudio();
      setSpatialAudioActive(false);
    } else {
      startSpatialAudio();
      setSpatialAudioActive(true);
    }
  };

  const handlePlay = () => {
    if (isPlaying) {
      broadcastPause();
    } else {
      broadcastPlay(sliderPosition);
    }
  };

  return (
    <div className="space-y-3">
      <div className="w-full">
        <div className="flex items-center justify-center gap-6 mb-2">
          <button
            className="text-gray-400 hover:text-white transition-colors cursor-pointer hover:scale-105 duration-200"
            onClick={handlePlay}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors cursor-pointer hover:scale-105 duration-200">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform cursor-pointer duration-200"
            onClick={handlePlay}
          >
            {isPlaying ? (
              <Pause className="w-4.5 h-4.5 fill-current stroke-1" />
            ) : (
              <Play className="w-4.5 h-4.5 fill-current" />
            )}
          </button>
          <button className="text-gray-400 hover:text-white transition-colors cursor-pointer hover:scale-105 duration-200">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors cursor-pointer hover:scale-105 duration-200">
            <Repeat className="w-4 h-4" />
          </button>
        </div>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className={isPlaying ? "" : ""}>
                <Slider
                  value={[sliderPosition]}
                  min={0}
                  max={trackDuration}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  onValueCommit={handleSliderCommit}
                  className="mt-4 mb-3"
                  disabled={isPlaying}
                />
              </div>
            </TooltipTrigger>
            {isPlaying && (
              <TooltipContent side="bottom">
                <p>Pause playback before changing position</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(sliderPosition)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => broadcastPlay(sliderPosition)}
          variant={isPlaying ? "secondary" : "default"}
          disabled={!selectedAudioId}
          size="sm"
          className="flex-1 min-w-[80px]"
        >
          {isPlaying ? (
            <RefreshCw className="h-4 w-4 mr-1" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          {isPlaying ? "Resync" : "Play"}
        </Button>
        <Button
          onClick={broadcastPause}
          variant="outline"
          disabled={!isPlaying || !selectedAudioId}
          size="sm"
          className="flex-1 min-w-[80px]"
        >
          <Pause className="h-4 w-4 mr-1" />
          Pause
        </Button>
        <Button
          onClick={handleSpatialAudioToggle}
          variant="outline"
          size="sm"
          className="flex-1 min-w-[140px] mt-2 sm:mt-0"
        >
          {spatialAudioActive ? (
            <>
              <StopCircleIcon className="h-4 w-4 mr-1" />
              Stop Spatial
            </>
          ) : (
            <>
              <RocketIcon className="h-4 w-4 mr-1" />
              Start Spatial
            </>
          )}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Especially on mobile devices, syncing is unstable. If you experience
        issues, try pressing <span className="font-semibold">Resync</span> a few
        times
      </div>
    </div>
  );
};
