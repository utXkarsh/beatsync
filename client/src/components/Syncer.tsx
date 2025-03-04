"use client";
import { Button } from "@/components/ui/button";
import { WSMessage } from "@shared/types";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Syncer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const newSocket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    newSocket.onopen = () => {
      console.log("Connected to WebSocket");
      setIsConnected(true);
    };

    newSocket.onmessage = (event) => {
      console.log("Message from server ", event.data);
      const message = event.data as WSMessage;
      if (message === WSMessage.Play) {
        audioRef.current!.play();
      } else if (message === WSMessage.Pause) {
        audioRef.current!.pause();
      }
    };

    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    setSocket(newSocket);

    // Preload audio
    audioRef.current = new Audio("/chess.mp3");

    return () => {
      newSocket.close();
    };
  }, []);

  const handlePlay = () => {
    socket?.send("play");
  };

  const handlePause = () => {
    if (socket) {
      socket?.send("pause");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="mb-4">
        Status: {isConnected ? "Connected" : "Disconnected"}
      </div>
      <div className="flex gap-2">
        <Button onClick={handlePlay} variant="default" size="default">
          <Play className="mr-2 h-4 w-4" />
          Play
        </Button>
        <Button onClick={handlePause} variant="default" size="default">
          <Pause className="mr-2 h-4 w-4" />
          Pause
        </Button>
      </div>
    </div>
  );
};
