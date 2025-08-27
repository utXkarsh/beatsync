"use client";
import { create } from "zustand";

// Interface for just the state values (without methods)
import { SongInfo } from "@beatsync/shared/types/room";

interface RoomStateValues {
  roomId: string;
  username: string;
  isLoadingRoom: boolean;
  perUserPlaybackEnabled: boolean;
  userPlayback: Record<string, SongInfo>;
}

interface RoomState extends RoomStateValues {
  setRoomId: (roomId: string) => void;
  setUsername: (username: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPerUserPlaybackEnabled: (enabled: boolean) => void;
  setUserPlayback: (userPlayback: Record<string, SongInfo>) => void;
  setMySong: (song: SongInfo) => void;
  reset: () => void;
}

// Define initial state object
const initialState: RoomStateValues = {
  roomId: "",
  username: "",
  isLoadingRoom: false,
  perUserPlaybackEnabled: false,
  userPlayback: {},
};

export const useRoomStore = create<RoomState>()((set, get) => ({
  // Set initial state
  ...initialState,

  // Actions
  setRoomId: (roomId) => set({ roomId }),
  setUsername: (username) => set({ username }),
  setIsLoading: (isLoading) => set({ isLoadingRoom: isLoading }),
  setPerUserPlaybackEnabled: (enabled) =>
    set({ perUserPlaybackEnabled: enabled }),
  setUserPlayback: (userPlayback) => set({ userPlayback }),
  setMySong: (song) => {
    const username = get().username;
    set((state) => ({
      userPlayback: {
        ...state.userPlayback,
        [username]: song,
      },
    }));
  },
  // Reset to initial state
  reset: () =>
    set((state) => ({
      ...initialState,
      username: state.username, // Preserve the current username
    })),
}));
