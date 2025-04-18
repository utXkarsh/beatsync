"use client";
import { create } from "zustand";

interface RoomState {
  roomId: string;
  username: string;
  userId: string;
  isLoadingRoom: boolean;
  setRoomId: (roomId: string) => void;
  setUsername: (username: string) => void;
  setUserId: (userId: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useRoomStore = create<RoomState>()((set) => ({
  roomId: "",
  username: "",
  userId: "",
  isLoadingRoom: false,
  setRoomId: (roomId) => set({ roomId }),
  setUsername: (username) => set({ username }),
  setUserId: (userId) => set({ userId }),
  setIsLoading: (isLoading) => set({ isLoadingRoom: isLoading }),
}));
