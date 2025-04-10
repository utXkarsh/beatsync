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
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select track" />
        </SelectTrigger>
        <SelectContent className="max-h-[40vh] overflow-y-auto">
          {audioSources.map((source) => (
            <SelectItem key={source.id} value={source.id} className="py-3 px-2">
              <div className="truncate max-w-[90vw] md:max-w-full">
                {source.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
