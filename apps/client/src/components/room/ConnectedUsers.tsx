"use client";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { ClientType, GRID } from "@beatsync/shared";
import { Hand, Move, Users } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export const ConnectedUsers = () => {
  const userId = useRoomStore((state) => state.userId);
  const socket = useGlobalStore((state) => state.socket);
  const spatialConfig = useGlobalStore((state) => state.spatialConfig);
  const gridRef = useRef<HTMLDivElement>(null);

  // Get clients directly from WebSocket events
  const [clients, setClients] = useState<ClientType[]>([]);

  // Set up an effect to listen for client changes via WebSocket
  useEffect(() => {
    if (socket) {
      // Set up a message handler for the CLIENT_CHANGE event
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data.type === "ROOM_EVENT" &&
            data.event?.type === "CLIENT_CHANGE"
          ) {
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

  // Function to update client position wrapped in useCallback to prevent recreation on every render
  const updatePosition = useCallback(
    (x: number, y: number) => {
      if (!socket || !userId) return;

      // Ensure values are within grid bounds
      const boundedX = Math.max(0, Math.min(GRID.SIZE, x));
      const boundedY = Math.max(0, Math.min(GRID.SIZE, y));

      socket.send(
        JSON.stringify({
          type: "UPDATE_POSITION",
          clientId: userId,
          position: {
            x: boundedX,
            y: boundedY,
          },
        })
      );
    },
    [socket, userId]
  );

  // Handle grid click to move client position
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current || !socket || !userId) return;

    const rect = gridRef.current.getBoundingClientRect();
    const gridWidth = rect.width;
    const gridHeight = rect.height;

    // Calculate position as percentage of grid size
    const x = Math.round(((e.clientX - rect.left) / gridWidth) * GRID.SIZE);
    const y = Math.round(((e.clientY - rect.top) / gridHeight) * GRID.SIZE);

    updatePosition(x, y);
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
          <>
            {/* 2D Grid Layout */}
            <div
              ref={gridRef}
              className="relative w-full aspect-square bg-muted/30 rounded-lg border border-border mb-4 overflow-hidden"
              style={{
                backgroundSize: "10% 10%",
                backgroundImage:
                  "linear-gradient(to right, rgba(55, 65, 81, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(55, 65, 81, 0.1) 1px, transparent 1px)",
                backgroundPosition: "0 0",
              }}
              onClick={handleGridClick}
            >
              <TooltipProvider>
                {clients.map((client) => {
                  const user = spatialConfig?.gains[client.clientId];
                  const isActive = user?.gain === 1;
                  const isFocused = user?.gain === 0; // The focused/active device in spatial audio
                  const isCurrentUser = client.clientId === userId;

                  // Position calculations
                  const left = `${client.position.x}%`;
                  const top = `${client.position.y}%`;

                  return (
                    <Tooltip key={client.clientId}>
                      <TooltipTrigger asChild>
                        <motion.div
                          className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
                            isFocused ? "z-30" : isActive ? "z-20" : "z-10"
                          )}
                          style={{
                            left,
                            top,
                          }}
                          initial={{ opacity: 0.8 }}
                          animate={{
                            opacity: 1,
                            scale: isFocused ? 1.2 : isActive ? 1.1 : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <div
                            className={cn(
                              "relative",
                              isFocused
                                ? "ring-2 ring-primary ring-offset-2"
                                : "",
                              isActive ? "ring-1 ring-secondary" : ""
                            )}
                          >
                            <Avatar
                              className={cn(
                                "h-10 w-10 border-2",
                                isFocused
                                  ? "border-primary"
                                  : isActive
                                  ? "border-secondary"
                                  : "border-border"
                              )}
                            >
                              <AvatarImage />
                              <AvatarFallback
                                className={generateColor(client.username)}
                              >
                                {client.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isFocused && (
                              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                            )}
                            {isActive && !isFocused && (
                              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-secondary" />
                            )}
                            {/* Add ping effect to all clients */}
                            <span
                              className="absolute inset-0 rounded-full opacity-75 animate-ping"
                              style={{
                                backgroundColor: isFocused
                                  ? "rgb(16 185 129 / 0.4)"
                                  : isActive
                                  ? "rgb(99 102 241 / 0.4)"
                                  : "rgb(156 163 175 / 0.3)",
                              }}
                            ></span>
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-xs font-medium">
                          {client.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isFocused
                            ? "Focused"
                            : isActive
                            ? "Active"
                            : isCurrentUser
                            ? "You"
                            : "Connected"}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>

            {/* List of connected users */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {[...clients].map((client) => {
                const user = spatialConfig?.gains[client.clientId];
                const isActive = user?.gain === 1;
                const isFocused = user?.gain === 0; // The focused/active device in spatial audio
                const isCurrentUser = client.clientId === userId;
                return (
                  <motion.div
                    key={client.clientId}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded-md transition-all duration-300 text-sm",
                      isFocused
                        ? "bg-primary/20 shadow-sm shadow-primary/20"
                        : isActive
                        ? "bg-primary/5"
                        : "bg-transparent"
                    )}
                    initial={{ opacity: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: isFocused ? 1.02 : isActive ? 1.01 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage />
                      <AvatarFallback
                        className={generateColor(client.username)}
                      >
                        {client.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate">
                        {client.username}
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
                        "ml-auto text-xs shrink-0 min-w-[60px] text-center py-0 h-5",
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
          </>
        )}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center gap-1"
            onClick={handleMoveToFront}
          >
            <Hand size={14} />
            <span>Move to Front</span>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center justify-center"
                  onClick={() => toast.info("Drag your avatar to reposition")}
                >
                  <Move size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="text-xs">Drag your avatar to reposition</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};
