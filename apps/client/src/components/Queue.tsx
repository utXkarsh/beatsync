import { LocalAudioSource } from "@/lib/localTypes";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/store/global";

export const Queue = ({ className, ...rest }: React.ComponentProps<"div">) => {
  const audioSources = useGlobalStore((state) => state.audioSources);
  const selectedAudioId = useGlobalStore((state) => state.selectedAudioId);
  const setSelectedAudioId = useGlobalStore(
    (state) => state.setSelectedAudioId
  );
  const isLoadingAudioSources = useGlobalStore((state) => state.isLoadingAudio);
  const broadcastPlay = useGlobalStore((state) => state.broadcastPlay);
  const isPlaying = useGlobalStore((state) => state.isPlaying);

  // Handle click on an item - select it and start playing
  const handleItemClick = (source: LocalAudioSource) => {
    // If it's already the selected track, just start playing
    if (source.id === selectedAudioId) {
      broadcastPlay(0); // Start from beginning
    } else {
      // Otherwise set the track and then play it
      setSelectedAudioId(source.id);
      // Small delay to ensure the track is loaded before playing
      setTimeout(() => {
        broadcastPlay(0);
      }, 50);
    }
  };

  return (
    <div className={cn("p-4", className)} {...rest}>
      <h2 className="text-lg font-medium mb-4">Tracks</h2>
      <div className="space-y-1">
        {audioSources.length > 0 ? (
          audioSources.map((source, index) => {
            const isSelected = source.id === selectedAudioId;
            const isPlayingThis = isSelected && isPlaying;

            return (
              <div
                key={source.id}
                className={cn(
                  "flex items-center pl-2 pr-4 py-3 rounded-md group transition-colors cursor-pointer",
                  isSelected
                    ? "text-white"
                    : "text-neutral-300 hover:bg-neutral-700/20"
                )}
                onClick={() => handleItemClick(source)}
              >
                {/* Track number / Play icon */}
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center relative">
                  {/* Play button (shown on hover) */}
                  <button
                    className="text-white text-sm hover:scale-110 transition-transform w-full h-full flex items-center justify-center absolute inset-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(source);
                    }}
                  >
                    ▶
                  </button>

                  {/* Playing indicator or track number (hidden on hover) */}
                  <div className="w-full h-full flex items-center justify-center group-hover:opacity-0 transition-opacity">
                    {isPlayingThis ? (
                      <span className="text-green-500 text-sm">♫</span>
                    ) : (
                      <span className="text-neutral-400 text-sm group-hover:opacity-0">
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Track name */}
                <div className="flex-grow min-w-0 ml-3">
                  <div
                    className={cn(
                      "font-medium text-sm truncate",
                      isSelected ? "text-green-400" : ""
                    )}
                  >
                    {source.name}
                  </div>
                </div>

                {/* Duration */}
                <div className="ml-4 text-xs text-neutral-500">
                  {formatTime(source.audioBuffer.duration)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-3 text-neutral-400">
            {isLoadingAudioSources
              ? "Loading tracks..."
              : "No tracks available"}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for formatting time
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
