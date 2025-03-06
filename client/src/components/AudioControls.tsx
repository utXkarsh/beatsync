"use client";

import { AudioLoadingState } from "@/types/audio";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AudioControlsProps {
  isMuted: boolean;
  loadingState: AudioLoadingState;
  selectedTrack: string;
  onPlay: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onTrackChange: (track: string) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isMuted,
  loadingState,
  selectedTrack,
  onPlay,
  onPause,
  onToggleMute,
  onTrackChange,
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Track selection */}
      <div className="mb-2">
        <Select
          value={selectedTrack}
          onValueChange={onTrackChange}
          defaultValue="/trndsttr.mp3"
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="/trndsttr.mp3">TRNDSTTR</SelectItem>
            <SelectItem value="/chess.mp3">Chess</SelectItem>
            <SelectItem value="/wonder.mp3">Wonder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onPlay}
          variant="default"
          size="default"
          disabled={loadingState !== "ready"}
        >
          <Play className="mr-2 h-4 w-4" />
          Play
        </Button>
        <Button
          onClick={onPause}
          variant="default"
          size="default"
          disabled={loadingState !== "ready"}
        >
          <Pause className="mr-2 h-4 w-4" />
          Pause
        </Button>
        <Button
          onClick={onToggleMute}
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
    </div>
  );
};
