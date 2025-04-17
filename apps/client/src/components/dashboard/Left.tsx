"use client";

import { cn } from "@/lib/utils";
import { useRoomStore } from "@/store/room";
import { motion } from "framer-motion";
import { Copy, Hash, Library, User } from "lucide-react";
import { toast } from "sonner";
import { AudioUploaderMinimal } from "../AudioUploaderMinimal";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface LeftProps {
  className?: string;
}

export const Left = ({ className }: LeftProps) => {
  const roomId = useRoomStore((state) => state.roomId);
  const username = useRoomStore((state) => state.username);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied to clipboard");
  };

  // const shareRoom = () => {
  //   try {
  //     navigator.share({
  //       title: "Join my BeatSync room",
  //       text: `Join my BeatSync room with code: ${roomId}`,
  //       url: window.location.href,
  //     });
  //   } catch {
  //     copyRoomId();
  //   }
  // };

  return (
    <motion.div
      className={cn(
        "w-full lg:w-72 flex-shrink-0 border-r border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md flex flex-col h-full text-sm",
        className
      )}
    >
      {/* Header section */}
      {/* <div className="px-3 py-2 flex items-center gap-2">
        <div className="bg-neutral-800 rounded-md p-1.5">
          <Music className="h-4 w-4 text-white" />
        </div>
        <h1 className="font-semibold text-white">Beatsync</h1>
      </div>


      <Separator className="bg-neutral-800/50" /> */}

      <h2 className="text-base font-bold select-none px-4 py-3 -mb-2">
        Your Library
      </h2>

      {/* Navigation menu */}
      <motion.div className="px-3.5 space-y-1.5 py-2">
        <Button
          className="w-full flex justify-start gap-3 py-2 text-white font-medium bg-white/10 hover:bg-white/15 rounded-md text-xs transition-colors duration-200"
          variant="ghost"
        >
          <Library className="h-4 w-4" />
          <span>Default Library</span>
        </Button>
      </motion.div>

      <Separator className="bg-neutral-800/50" />

      {/* Room info section */}
      <motion.div className="px-4 space-y-3 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          Session Info
        </h2>

        <div className="space-y-3">
          <motion.div className="bg-neutral-800/50 rounded-md p-2 overflow-hidden">
            <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
              <Hash className="h-3 w-3" /> Room
            </div>
            <div className="flex items-center justify-between">
              <div
                className="text-sm text-white font-medium truncate"
                title={roomId}
              >
                {roomId}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 rounded-full hover:bg-white/10"
                onClick={copyRoomId}
                title="Copy room ID"
              >
                <Copy className="h-3 w-3 text-neutral-400" />
              </Button>
            </div>
          </motion.div>

          <motion.div className="bg-neutral-800/50 rounded-md p-2">
            <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
              <User className="h-3 w-3" /> Username
            </div>
            <div className="text-sm text-white font-medium truncate">
              {username}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Tips Section */}
      <motion.div className="mt-auto pb-4 pt-2 text-neutral-400">
        <div className="flex flex-col gap-2 p-4 border-t border-neutral-800/50">
          <h5 className="text-xs font-medium text-neutral-300">Tips</h5>
          <ul className="list-disc list-outside pl-4 space-y-1.5">
            <li className="text-xs leading-relaxed">
              Works best with multiple devices IRL in the same space.
            </li>
            <li className="text-xs leading-relaxed">
              If audio gets de-synced, pause + play and try again.
            </li>
            <li className="text-xs leading-relaxed">
              On mobile, check silent mode is off.
            </li>
            <li className="text-xs leading-relaxed">
              {"Play on speaker directly. Don't use Bluetooth."}
            </li>
          </ul>
        </div>

        <div className="pl-1">
          <AudioUploaderMinimal />
        </div>
      </motion.div>
    </motion.div>
  );
};
