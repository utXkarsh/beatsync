"use client";
import { useRoom } from "@/context/room";

export const Room = () => {
  const { roomId, username } = useRoom();

  return (
    <div>
      <div>Room: {roomId}</div>
      <div>Username: {username}</div>
    </div>
  );
};
