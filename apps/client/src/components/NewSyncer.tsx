"use client";
import { fetchAudio } from "@/lib/api";
import { RawAudioSource } from "@/lib/localTypes";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { NTPMeasurement } from "@/utils/ntp";
import {
  ClientActionEnum,
  ClientType,
  NTPResponseMessageType,
  WSResponseSchema,
} from "@beatsync/shared";
import { AlertTriangle, Hand, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AudioUploader } from "./AudioUploader";
import { NTP } from "./room/NTP";
import { Player } from "./room/Player";
import { SocketStatus } from "./room/SocketStatus";
import { TrackSelector } from "./TrackSelector";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SyncProgress } from "./ui/SyncProgress";
import { UploadHistory } from "./UploadHistory";

// TODO: USE react-use-websocket
const handleNTPResponse = (response: NTPResponseMessageType) => {
  const t3 = Date.now();
  const { t0, t1, t2 } = response;

  // Calculate round-trip delay and clock offset
  // See: https://en.wikipedia.org/wiki/Network_Time_Protocol#Clock_synchronization_algorithm
  const clockOffset = (t1 - t0 + (t2 - t3)) / 2;
  const roundTripDelay = t3 - t0 - (t2 - t1);

  const measurement: NTPMeasurement = {
    t0,
    t1,
    t2,
    t3,
    roundTripDelay,
    clockOffset,
  };

  return measurement;
};

export const NewSyncer = () => {
  // Room
  const roomId = useRoomStore((state) => state.roomId);
  const username = useRoomStore((state) => state.username);
  const userId = useRoomStore((state) => state.userId);
  const isLoadingRoom = useRoomStore((state) => state.isLoadingRoom);
  const setUserId = useRoomStore((state) => state.setUserId);

  // Audio
  const setSocket = useGlobalStore((state) => state.setSocket);
  const socket = useGlobalStore((state) => state.socket);
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);
  const schedulePlay = useGlobalStore((state) => state.schedulePlay);
  const schedulePause = useGlobalStore((state) => state.schedulePause);
  const processGains = useGlobalStore((state) => state.processGains);
  // Socket
  const sendNTPRequest = useGlobalStore((state) => state.sendNTPRequest);
  const addNTPMeasurement = useGlobalStore((state) => state.addNTPMeasurement);
  const isSynced = useGlobalStore((state) => state.isSynced);
  const addAudioSource = useGlobalStore((state) => state.addAudioSource);
  const spatialConfig = useGlobalStore((state) => state.spatialConfig);

  // Transition state for delayed showing of main UI
  const [showingSyncScreen, setShowingSyncScreen] = useState(true);

  // Add effect to delay hiding the sync screen after sync completes
  useEffect(() => {
    if (isSynced && showingSyncScreen) {
      // const timer = setTimeout(() => {
      setShowingSyncScreen(false);
      // }, 0);

      // return () => clearTimeout(timer);
    }
  }, [isSynced, showingSyncScreen]);

  // Once room has been loaded, connect to the websocket
  useEffect(() => {
    // Only run this effect once after room is loaded
    if (isLoadingRoom) return;

    // Don't create a new connection if we already have one
    if (socket) {
      return;
    }

    const SOCKET_URL = `${process.env.NEXT_PUBLIC_WS_URL}?roomId=${roomId}&userId=${userId}&username=${username}`;
    console.log("Creating new socket to", SOCKET_URL);
    const ws = new WebSocket(SOCKET_URL);
    setSocket(ws);

    ws.onopen = () => {
      console.log("Websocket onopen fired.");

      // Start syncing
      sendNTPRequest();
    };

    ws.onclose = () => {
      console.log("Websocket onclose fired.");
    };

    ws.onmessage = async (msg) => {
      const response = WSResponseSchema.parse(JSON.parse(msg.data));

      if (response.type === "NTP_RESPONSE") {
        const ntpMeasurement = handleNTPResponse(response);
        addNTPMeasurement(ntpMeasurement);

        // Check that we have not exceeded the max and then send another NTP request
        setTimeout(() => {
          sendNTPRequest();
        }, 30); // 30ms delay to not overload
      } else if (response.type === "ROOM_EVENT") {
        const { event } = response;
        console.log("Room event:", event);

        if (event.type === "CLIENT_CHANGE") {
          setClients(event.clients);
        } else if (event.type === "NEW_AUDIO_SOURCE") {
          console.log("Received new audio source:", response);
          const { title, id } = event;

          // Check if we already have this audio file downloaded
          const hasDownloaded = useGlobalStore
            .getState()
            .hasDownloadedAudio(id);

          if (hasDownloaded) {
            console.log(`Audio file ${id} already downloaded, skipping fetch`);
            return;
          }

          toast.promise(
            fetchAudio(id)
              .then(async (blob) => {
                console.log("Audio fetched successfully:", id);
                try {
                  const arrayBuffer = await blob.arrayBuffer();
                  console.log("ArrayBuffer created successfully");

                  const audioSource: RawAudioSource = {
                    name: title,
                    audioBuffer: arrayBuffer,
                    id: id, // Include ID in the RawAudioSource
                  };

                  return addAudioSource(audioSource);
                } catch (error) {
                  console.error("Error processing audio data:", error);
                  throw new Error("Failed to process audio data");
                }
              })
              .catch((error) => {
                console.error("Error fetching audio:", error);
                throw error;
              }),
            {
              loading: "Loading audio...",
              success: `Added: ${title}`,
              error: "Failed to load audio",
            }
          );
        }
      } else if (response.type === "SCHEDULED_ACTION") {
        // handle scheduling action
        console.log("Received scheduled action:", response);
        const { scheduledAction, serverTimeToExecute } = response;

        if (scheduledAction.type === "PLAY") {
          schedulePlay({
            trackTimeSeconds: scheduledAction.trackTimeSeconds,
            targetServerTime: serverTimeToExecute,
            audioId: scheduledAction.audioId,
          });
        } else if (scheduledAction.type === "PAUSE") {
          schedulePause({
            targetServerTime: serverTimeToExecute,
          });
        } else if (scheduledAction.type === "SPATIAL_CONFIG") {
          processGains(scheduledAction);
        }
      } else if (response.type === "SET_CLIENT_ID") {
        setUserId(response.clientId);
      } else {
        console.log("Unknown response type:", response);
      }
    };

    return () => {
      // Runs on unmount and dependency change
      console.log("Running cleanup for WebSocket connection");
      ws.close();
    };
    // Not including socket in the dependency array because it will trigger the close when it's set
  }, [isLoadingRoom, roomId, username, setSocket]);

  // Local state to the syncer:
  const [clients, setClients] = useState<ClientType[]>([]);

  // Function to request client reordering
  const handleMoveToFront = () => {
    if (!socket || !userId) return;

    socket.send(
      JSON.stringify({
        type: ClientActionEnum.enum.REORDER_CLIENT,
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

  // Check if the current user's device is the active one in spatial audio
  const isCurrentDeviceActive = spatialConfig?.gains[userId]?.gain === 1;

  return (
    <>
      {isCurrentDeviceActive && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-blue-600/50 via-pink-500/30 to-blue-400/25 blur-lg"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 1.2 }}
            className="fixed inset-0 pointer-events-none -z-10 bg-radial-gradient from-pink-600/50 via-transparent to-transparent blur-xl mix-blend-screen"
          />

          {/* Additional color spots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.5, 0.7, 0.5],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="fixed top-[10%] left-[15%] w-[30vw] h-[30vw] rounded-full bg-pink-600/20 blur-3xl pointer-events-none -z-10"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.4, 0.6, 0.4],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="fixed bottom-[20%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-purple-600/20 blur-3xl pointer-events-none -z-10"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
            className="fixed top-[40%] right-[20%] w-[20vw] h-[20vw] rounded-full bg-blue-500/20 blur-3xl pointer-events-none -z-10"
          />

          {/* New highlight spots for extra pop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="fixed top-[30%] left-[30%] w-[15vw] h-[15vw] rounded-full bg-cyan-500/20 blur-2xl pointer-events-none -z-10"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.15, 1],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
            className="fixed bottom-[35%] left-[15%] w-[18vw] h-[18vw] rounded-full bg-indigo-500/20 blur-2xl pointer-events-none -z-10"
          />
        </>
      )}
      <div className="container mx-auto p-4 space-y-6 relative">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <Card className="w-full md:w-2/3">
            <CardHeader>
              <CardTitle>Room Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Room ID</span>
                  <span className="font-medium">{roomId}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Username
                  </span>
                  <span className="font-medium">{username}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">User ID</span>
                  <span className="font-medium truncate">{userId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>

        <div className="flex items-center gap-2">
          <SocketStatus />
          {/* <Button onClick={() => setGain(0.1, )} variant="outline" size="sm">
          Fade out
        </Button>
        <Button onClick={() => setGain(1)} variant="outline" size="sm">
          Fade in
        </Button> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Music</CardTitle>
              </CardHeader>
              <CardContent>
                <AudioUploader />
              </CardContent>
            </Card>

            <UploadHistory />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Network Synchronization</CardTitle>
          </CardHeader>
          <CardContent>
            <NTP />
          </CardContent>
        </Card>

        <AnimatePresence>
          {isLoadingAudio && (
            <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <SyncProgress
                loadingMessage={
                  isLoadingRoom
                    ? "Loading audio"
                    : !socket
                    ? "Connecting to server"
                    : "Loading room"
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
