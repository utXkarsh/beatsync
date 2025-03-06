"use client";
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface RoomContextType {
  socketRef: RefObject<WebSocket | null>;
  roomId: string;
  username: string;
  userId: string;
  setWebsocket: (websocket: WebSocket) => void;
  setRoomId: (roomId: string) => void;
  setUsername: (username: string) => void;
  setUserId: (userId: string) => void;
  isLoading: boolean;
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
  const socketRef = useRef<WebSocket>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with empty values first
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // Load values from localStorage after component mounts (client-side only)
  useEffect(() => {
    // Now we're definitely in the browser
    setRoomId(localStorage.getItem("roomId") || "");
    setUsername(localStorage.getItem("username") || "");
    setUserId(localStorage.getItem("userId") || "");
    setIsLoading(false);
  }, []);

  // Sync to localStorage when state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("roomId", roomId);
    }
  }, [roomId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("username", username);
    }
  }, [username]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userId", userId);
    }
  }, [userId]);

  const setWebsocket = (websocket: WebSocket) => {
    socketRef.current = websocket;
  };

  const value = {
    socketRef,
    roomId,
    username,
    userId,
    setWebsocket,
    setRoomId,
    setUsername,
    setUserId,
    isLoading,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
