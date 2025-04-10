"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGlobalStore } from "@/store/global";

export const TrackSelector = () => {
  const audioSources = useGlobalStore((state) => state.audioSources);
  const selectedAudioId = useGlobalStore((state) => state.selectedAudioId);
  const setSelectedAudioId = useGlobalStore(
    (state) => state.setSelectedAudioId
  );
  const isLoadingAudioSources = useGlobalStore((state) => state.isLoadingAudio);

  return (
    <div className="mt-4 mb-4">
      <Select
        value={selectedAudioId || ""}
        onValueChange={(value) => setSelectedAudioId(value)}
        disabled={isLoadingAudioSources || audioSources.length === 0}
      >
        <SelectTrigger className="w-sm">
          <SelectValue placeholder="Select track" />
        </SelectTrigger>
        <SelectContent>
          {audioSources.map((source) => (
            <SelectItem key={source.id} value={source.id}>
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
