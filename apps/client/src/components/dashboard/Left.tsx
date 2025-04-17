"use client";

import { useRoomStore } from "@/store/room";
import { Hash, Library, User } from "lucide-react";
import { AudioUploaderMinimal } from "../AudioUploaderMinimal";
import { Separator } from "../ui/separator";

export const Left = () => {
  const roomId = useRoomStore((state) => state.roomId);
  const username = useRoomStore((state) => state.username);

  return (
    <div className="w-60 flex-shrink-0 border-r border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md flex flex-col h-full text-sm">
      {/* Header section */}
      {/* <div className="px-3 py-2 flex items-center gap-2">
        <div className="bg-neutral-800 rounded-md p-1.5">
          <Music className="h-4 w-4 text-white" />
        </div>
        <h1 className="font-semibold text-white">Beatsync</h1>
      </div>

      <Separator className="bg-neutral-800/50" /> */}

      {/* Navigation menu */}
      <div className="px-2 space-y-0.5 py-2">
        {/* <button className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </button> */}
        <button className="w-full flex items-center gap-3 px-3 py-2 text-white font-medium bg-white/10 rounded-md text-sm">
          <Library className="h-4 w-4" />
          <span>Default Library</span>
        </button>
      </div>

      <Separator className="bg-neutral-800/50" />

      {/* Room info section */}
      <div className="px-4 space-y-3 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          Session Info
        </h2>

        <div className="space-y-2">
          <div>
            <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
              <Hash className="h-3 w-3" /> Room ID
            </div>
            <div
              className="text-sm text-white font-medium truncate"
              title={roomId}
            >
              {roomId}
            </div>
          </div>

          <div>
            <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
              <User className="h-3 w-3" /> Username
            </div>
            <div className="text-sm text-white font-medium truncate">
              {username}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto px-3 pb-4 pt-2">
        <AudioUploaderMinimal />
      </div>
    </div>
  );
};
