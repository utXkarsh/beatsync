"use client";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SyncProgress } from "../ui/SyncProgress";
import { NTP } from "./NTP";

export const SyncStatus = () => {
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);
  const isLoadingRoom = useRoomStore((state) => state.isLoadingRoom);
  const socket = useGlobalStore((state) => state.socket);

  return (
    <>
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
    </>
  );
};
