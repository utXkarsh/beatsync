import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudioSources } from "@/hooks/useAudioSources";

export const TrackSelector: React.FC = () => {
  const { audioSources, isLoadingAudioSources } = useAudioSources();

  return (
    <div className="mt-4 mb-4">
      <Select
        // value={selectedTrack}
        // onValueChange={onTrackChange}
        disabled={isLoadingAudioSources}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select track" />
        </SelectTrigger>
        <SelectContent>
          {audioSources.map((source) => (
            <SelectItem key={source.name} value={source.name}>
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
