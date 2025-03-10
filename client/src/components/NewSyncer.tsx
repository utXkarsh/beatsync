"use client";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { useEffect } from "react";
import { TrackSelector } from "./TrackSelector";
import { Player } from "./room/Player";
import { SocketStatus } from "./room/SocketStatus";
import { NTPResponseMessage, WSResponseSchema } from "@shared/types";
import { toast } from "sonner";
import { NTPMeasurement } from "@/utils/ntp";
import { NTP } from "./room/NTP";

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

  console.log("Measurement ", measurement);
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

  // Socket
  const sendNTPRequest = useGlobalStore((state) => state.sendNTPRequest);
  const addNTPMeasurement = useGlobalStore((state) => state.addNTPMeasurement);

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
      console.log("Connected to WebSocket");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onmessage = (msg) => {
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
        } else if (event.type === "NEW_AUDIO_SOURCE") {
          toast(`New audio source added: ${event.source.title}`);
        }
      } else if (response.type === "SCHEDULED_ACTION") {
        // handle scheduling action
        console.log("Received scheduled action:", response);
        const { scheduledAction, timeToExecute } = response;

        if (scheduledAction.type === "PLAY") {
          schedulePlay({
            trackTimeSeconds: scheduledAction.trackTimeSeconds,
            targetServerTime: timeToExecute,
          });
        } else if (scheduledAction.type === "PAUSE") {
          schedulePause({
            targetServerTime: timeToExecute,
          });
        }
      }
    };

    return () => {
      // Runs on unmount and dependency change
      console.log("Running cleanup for WebSocket connection");
      ws.close();
    };
    // Not including socket in the dependency array because it will trigger the close
  }, [isLoadingRoom, roomId, userId, username, setSocket]);

  console.log("NewSyncer render");

  if (isLoadingRoom || !socket || isLoadingAudio) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/90">
        <div className="w-6 h-6 border-1 border-t-gray-800 rounded-full animate-spin"></div>
        <span className="ml-3 text-base font-normal text-gray-500">
          {isLoadingRoom
            ? "Loading room"
            : !socket
            ? "Loading socket"
            : "Loading audio"}
          ...
        </span>
      </div>
    );
  }

  return (
    <div>
      <SocketStatus />
      <div>
        <div>Room: {roomId}</div>
        <div>Username: {username}</div>
        <div>User ID: {userId}</div>
      </div>
      NewSyncer
      <div>
        {isLoadingRoom && <div>Loading...</div>}
        <TrackSelector />
        <NTP />
        <Player />
      </div>
    </div>
  );
};
