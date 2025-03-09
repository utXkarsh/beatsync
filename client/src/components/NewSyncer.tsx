"use client";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { useEffect } from "react";
import { TrackSelector } from "./TrackSelector";

export const NewSyncer = () => {
  // Room
  const roomId = useRoomStore((state) => state.roomId);
  const username = useRoomStore((state) => state.username);
  const userId = useRoomStore((state) => state.userId);
  const isLoadingRoom = useRoomStore((state) => state.isLoadingRoom);

  const audioSources = useGlobalStore((state) => state.audioSources);
  const isLoadingAudioSources = useGlobalStore(
    (state) => state.isLoadingAudioSources
  );

  // Once room has been loaded, connect to the websocket
  useEffect(() => {}, []);

  console.log("render", audioSources);

  if (isLoadingRoom) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/90">
        <div className="w-6 h-6 border-1 border-t-gray-800 rounded-full animate-spin"></div>
        <span className="ml-3 text-base font-normal text-gray-500">
          Loading{" "}
          {isLoadingRoom
            ? "room data"
            : isLoadingAudioSources
            ? "audio tracks"
            : ""}
          ...
        </span>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div>Room: {roomId}</div>
        <div>Username: {username}</div>
        <div>User ID: {userId}</div>
      </div>
      NewSyncer
      <div>
        {isLoadingRoom && <div>Loading...</div>}
        <TrackSelector />
      </div>
    </div>
  );
};
