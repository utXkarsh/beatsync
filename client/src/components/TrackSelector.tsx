import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrackSelectorProps {
  selectedTrack: string;
  onTrackChange: (track: string) => void;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  selectedTrack,
  onTrackChange,
}) => {
  return (
    <div className="mt-4 mb-4">
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
  );
};
