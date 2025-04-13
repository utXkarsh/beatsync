"use client";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrackSelector } from "../TrackSelector";
import { Player } from "./Player";

export const MusicControls = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Music Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
          <p className="text-sm text-yellow-500 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>These controls affect all users in the room.</span>
          </p>
        </div>
        <TrackSelector />
        <Player />
      </CardContent>
    </Card>
  );
};
