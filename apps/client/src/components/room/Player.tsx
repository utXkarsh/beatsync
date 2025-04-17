import { formatTime } from "@/lib/utils";

import { useGlobalStore } from "@/store/global";
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
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

  const handlePlay = () => {
    if (isPlaying) {
      broadcastPause();
    } else {
      broadcastPlay(sliderPosition);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[37rem]">
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
              <Pause className="w-4 h-4 fill-current stroke-1" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
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
              <div className="flex items-center gap-0">
                <span className="text-xs text-muted-foreground min-w-12 select-none">
                  {formatTime(sliderPosition)}
                </span>
                <Slider
                  value={[sliderPosition]}
                  min={0}
                  max={trackDuration}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  onValueCommit={handleSliderCommit}
                  disabled={isPlaying}
                />
                <span className="text-xs text-muted-foreground min-w-12 text-right select-none">
                  {formatTime(trackDuration)}
                </span>
              </div>
            </TooltipTrigger>
            {isPlaying && (
              <TooltipContent side="top">
                <p className="text-sm flex items-center gap-1.5">
                  <Pause className="h-4 w-4" />
                  Pause playback before changing position
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
