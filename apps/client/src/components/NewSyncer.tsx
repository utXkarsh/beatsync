"use client";
import { fetchAudio } from "@/lib/api";
import { RawAudioSource } from "@/lib/localTypes";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { NTPMeasurement } from "@/utils/ntp";
import { NTPResponseMessage, WSResponseSchema } from "@beatsync/shared";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AudioUploader } from "./AudioUploader";
import { NTP } from "./room/NTP";
import { Player } from "./room/Player";
import { SocketStatus } from "./room/SocketStatus";
import { TrackSelector } from "./TrackSelector";
import { Button } from "./ui/button";
import { SyncProgress } from "./ui/SyncProgress";

const handleNTPResponse = (response: NTPResponseMessage) => {
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

        if (event.type === "JOIN") {
          toast(`User ${event.username} joined the room`);
        }
      } else if (response.type === "SCHEDULED_ACTION") {
        // handle scheduling action
        console.log("Received scheduled action:", response);
        const { scheduledAction, timeToExecute } = response;

        if (scheduledAction.type === "PLAY") {
          schedulePlay({
            trackTimeSeconds: scheduledAction.trackTimeSeconds,
            targetServerTime: timeToExecute,
            trackIndex: scheduledAction.trackIndex,
          });
        } else if (scheduledAction.type === "PAUSE") {
          schedulePause({
            targetServerTime: timeToExecute,
          });
        }
      } else if (response.type === "NEW_AUDIO_SOURCE") {
        console.log("Received new audio source:", response);
        const { title, id } = response;

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
    };

    return () => {
      // Runs on unmount and dependency change
      console.log("Running cleanup for WebSocket connection");
      ws.close();
    };
    // Not including socket in the dependency array because it will trigger the close when it's set
  }, [isLoadingRoom, roomId, userId, username, setSocket]);

  return (
    <div>
      <SocketStatus />
      <Button onClick={() => setGain(0.5)}>Fade out</Button>
      <Button onClick={() => setGain(1)}>Fade in</Button>
      <div>
        <div>Room: {roomId}</div>
        <div>Username: {username}</div>
        <div>User ID: {userId}</div>
      </div>
      NewSyncer
      <div>
        {isLoadingRoom && <div>Loading...</div>}
        <TrackSelector />
        <AudioUploader />
        <NTP />
        <Player />
      </div>
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
