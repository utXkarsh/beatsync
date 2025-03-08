import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudioSources } from "@/context/audiosources";

export const TrackSelector = () => {
  const {
    audioSources,
    isLoadingAudioSources,
    selectedSourceIndex,
    setSelectedSourceIndex,
  } = useAudioSources();

  return (
    <div className="mt-4 mb-4">
      <Select
        value={selectedSourceIndex.toString()}
        onValueChange={(value) => setSelectedSourceIndex(parseInt(value))}
        disabled={isLoadingAudioSources}
      >
        <SelectTrigger className="w-sm">
          <SelectValue placeholder="Select track" />
        </SelectTrigger>
        <SelectContent>
          {audioSources.map((source, index) => (
            <SelectItem key={source.name} value={index.toString()}>
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
