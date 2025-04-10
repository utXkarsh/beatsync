"use client";

import { useGlobalStore } from "@/store/global";
import { History } from "lucide-react";
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
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {uploadHistory.map((item) => (
              <div
                key={`${item.name}-${item.timestamp}`}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
