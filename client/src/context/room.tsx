"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface RoomContextType {
  websocket: string;
  roomId: string;
  username: string;
  userId: string;
  setWebsocket: (websocket: string) => void;
  setRoomId: (roomId: string) => void;
  setUsername: (username: string) => void;
  setUserId: (userId: string) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}

interface RoomProviderProps {
  children: ReactNode;
}

export function RoomProvider({ children }: RoomProviderProps) {
  const [websocket, setWebsocket] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const value = {
    websocket,
    roomId,
    username,
    userId,
    setWebsocket,
    setRoomId,
    setUsername,
    setUserId,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
