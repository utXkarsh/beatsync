import { useState } from "react";

interface QueueItemType {
  id: string;
  title: string;
  artist: string;
  duration: string;
  image?: string;
}

interface QueueProps {
  items?: QueueItemType[];
  onItemClick?: (item: QueueItemType) => void;
  className?: string;
}

export const Queue = ({
  items = [],
  onItemClick,
  className = "",
}: QueueProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Use placeholder items if no items provided
  const displayItems =
    items.length > 0
      ? items
      : [
          { id: "1", title: "Track 1", artist: "Artist 1", duration: "3:42" },
          { id: "2", title: "Track 2", artist: "Artist 2", duration: "4:15" },
          { id: "3", title: "Track 3", artist: "Artist 3", duration: "2:58" },
        ];

  return (
    <div
      className={`p-4 bg-neutral-800/30 backdrop-blur-md rounded-xl border border-neutral-700/50 ${className}`}
    >
      <h2 className="text-lg font-medium mb-4">Queue</h2>
      <div className="space-y-2">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center p-2 rounded-lg hover:bg-neutral-700/30 transition-colors cursor-pointer"
            onClick={() => onItemClick?.(item)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              className={`w-10 h-10 rounded-md flex-shrink-0 mr-3 overflow-hidden transition-all duration-300 ${
                hoveredItem === item.id ? "scale-105" : ""
              }`}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                  <span className="text-xs text-neutral-400">♪</span>
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-neutral-400">{item.artist}</div>
            </div>
            <div className="ml-auto text-xs text-neutral-500">
              {item.duration}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
