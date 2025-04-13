"use client";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { ClientType } from "@beatsync/shared";
import { Hand, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const ConnectedUsers = () => {
  const userId = useRoomStore((state) => state.userId);
  const socket = useGlobalStore((state) => state.socket);
  const spatialConfig = useGlobalStore((state) => state.spatialConfig);
  
  // Get clients directly from WebSocket events
  const [clients, setClients] = useState<ClientType[]>([]);
  
  // Set up an effect to listen for client changes via WebSocket
  useEffect(() => {
    if (socket) {
      // Set up a message handler for the CLIENT_CHANGE event
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ROOM_EVENT" && data.event?.type === "CLIENT_CHANGE") {
            setClients(data.event.clients);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      // Add the message listener
      socket.addEventListener("message", handleMessage);
      
      // Clean up the listener when the component unmounts or socket changes
      return () => {
        socket.removeEventListener("message", handleMessage);
      };
    }
  }, [socket]);

  // Function to request client reordering
  const handleMoveToFront = () => {
    if (!socket || !userId) return;

    socket.send(
      JSON.stringify({
        type: "REORDER_CLIENT",
        clientId: userId,
      })
    );

    toast.success("Moved to the front");
  };

  // Generate a color based on username for avatar fallback
  const generateColor = (username: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];

    // Simple hash function to get a consistent color for the same username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className="w-full md:w-1/3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Users size={18} />
          <span>Connected Users</span>
        </CardTitle>
        <div className="flex items-center">
          <Badge variant="outline">{clients.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No other users connected
          </div>
        ) : (
          <div className="space-y-3">
            {[...clients].reverse().map((client) => {
              const user = spatialConfig?.gains[client.clientId];
              const isActive = user?.gain === 1;
              const isFocused = user?.gain === 0; // The focused/active device in spatial audio
              const isCurrentUser = client.clientId === userId;
              return (
                <motion.div
                  key={client.clientId}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md transition-all duration-300",
                    isFocused
                      ? "bg-primary/20 shadow-md shadow-primary/20"
                      : isActive
                      ? "bg-primary/5"
                      : "bg-transparent"
                  )}
                  initial={{ opacity: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: isFocused ? 1.05 : isActive ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage />
                    <AvatarFallback
                      className={generateColor(client.username)}
                    >
                      {client.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium">
                      {client.username}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {client.clientId}
                    </span>
                  </div>
                  <Badge
                    variant={
                      isFocused
                        ? "default"
                        : isActive
                        ? "secondary"
                        : isCurrentUser
                        ? "secondary"
                        : "outline"
                    }
                    className={cn(
                      "ml-auto text-xs shrink-0 min-w-[70px] text-center",
                      isFocused ? "bg-primary animate-pulse" : ""
                    )}
                  >
                    {isFocused
                      ? "Focused"
                      : isActive
                      ? "Active"
                      : isCurrentUser
                      ? "You"
                      : "Connected"}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        )}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-1"
            onClick={handleMoveToFront}
          >
            <Hand size={14} />
            <span>Move to Front</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
