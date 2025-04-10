"use client";

import { useGlobalStore } from "@/store/global";
import { CloudUpload, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Helper function to format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  // Convert to appropriate time unit
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return `${Math.floor(diff / 86400000)} days ago`;
};

export const UploadHistory = () => {
  const uploadHistory = useGlobalStore((state) => state.uploadHistory);
  const reuploadAudio = useGlobalStore((state) => state.reuploadAudio);

  const handleReupload = (item: {
    name: string;
    timestamp: number;
    id: string;
  }) => {
    reuploadAudio(item.id, item.name);
    toast.success(`Rebroadcasting ${item.name} to all users`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <History size={18} />
          <span>Upload History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploadHistory.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No upload history yet
          </div>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto w-full">
            {uploadHistory.map((item) => (
              <div
                key={`${item.name}-${item.timestamp}`}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                {item.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReupload(item)}
                    className="h-8 w-8 p-0 flex-shrink-0 ml-2"
                    title="Reupload to all users"
                  >
                    <CloudUpload size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
