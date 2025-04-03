"use client";
import { fetchAudio } from "@/lib/api";
import { RawAudioSource } from "@/lib/localTypes";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { NTPMeasurement } from "@/utils/ntp";
import {
  ClientType,
  NTPResponseMessageType,
  WSResponseSchema,
} from "@beatsync/shared";
import { Users } from "lucide-react";
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
  const setGain = useGlobalStore((state) => state.setGain);
  // Socket
  const sendNTPRequest = useGlobalStore((state) => state.sendNTPRequest);
  const addNTPMeasurement = useGlobalStore((state) => state.addNTPMeasurement);
  const isSynced = useGlobalStore((state) => state.isSynced);
  const addAudioSource = useGlobalStore((state) => state.addAudioSource);
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

          toast.promise(
            fetchAudio(id).then(async (blob) => {
              const arrayBuffer = await blob.arrayBuffer();
              const audioSource: RawAudioSource = {
                name: title,
                audioBuffer: arrayBuffer,
              };
              return addAudioSource(audioSource);
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
            trackIndex: scheduledAction.trackIndex,
          });
        } else if (scheduledAction.type === "PAUSE") {
          schedulePause({
            targetServerTime: serverTimeToExecute,
          });
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
    <div className="container mx-auto p-4 space-y-6">
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
                <span className="text-sm text-muted-foreground">Username</span>
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
            <Badge variant="outline">{clients.length}</Badge>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No other users connected
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div
                    key={client.clientId}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                      // src={`https://avatar.vercel.sh/${client.username}`}
                      />
                      <AvatarFallback
                        className={generateColor(client.username)}
                      >
                        {client.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {client.username}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {client.clientId}
                      </span>
                    </div>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {client.clientId === userId ? "You" : "Connected"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <SocketStatus />
        <Button onClick={() => setGain(0.1)} variant="outline" size="sm">
          Fade out
        </Button>
        <Button onClick={() => setGain(1)} variant="outline" size="sm">
          Fade in
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Music Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TrackSelector />
            <Player />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Music</CardTitle>
          </CardHeader>
          <CardContent>
            <AudioUploader />
          </CardContent>
        </Card>
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
  );
};
