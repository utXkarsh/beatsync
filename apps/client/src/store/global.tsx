/* eslint-disable @typescript-eslint/no-unused-vars */
import { LocalAudioSource, RawAudioSource } from "@/lib/localTypes";
import {
  NTPMeasurement,
  _sendNTPRequest,
  calculateOffsetEstimate,
  calculateWaitTimeMilliseconds,
} from "@/utils/ntp";
import { sendWSRequest } from "@/utils/ws";
import {
  ClientActionEnum,
  ClientType,
  GRID,
  PositionType,
  SpatialConfigType,
} from "@beatsync/shared";
import { toast } from "sonner";
import { create } from "zustand";
import { useRoomStore } from "./room";

export const MAX_NTP_MEASUREMENTS = 40;

// https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch02.html

interface StaticAudioSource {
  name: string;
  url: string;
  id: string;
}

interface AudioPlayerState {
  audioContext: AudioContext;
  sourceNode: AudioBufferSourceNode;
  gainNode: GainNode;
}

enum AudioPlayerError {
  NotInitialized = "NOT_INITIALIZED",
}

interface GlobalState {
  // Audio Sources
  audioSources: LocalAudioSource[];
  isLoadingAudio: boolean;
  selectedAudioId: string;
  uploadHistory: { name: string; timestamp: number; id: string }[];
  downloadedAudioIds: Set<string>;
  addToUploadHistory: (name: string, id: string) => void;
  reuploadAudio: (audioId: string, audioName: string) => void;
  hasDownloadedAudio: (id: string) => boolean;
  markAudioAsDownloaded: (id: string) => void;
  setAudioSources: (sources: LocalAudioSource[]) => void;
  addAudioSource: (source: RawAudioSource) => Promise<void>;
  setIsLoadingAudio: (isLoading: boolean) => void;
  setSelectedAudioId: (audioId: string) => boolean;
  findAudioIndexById: (audioId: string) => number | null;
  schedulePlay: (data: {
    trackTimeSeconds: number;
    targetServerTime: number;
    audioId: string;
  }) => void;
  schedulePause: (data: { targetServerTime: number }) => void;

  // Websocket
  socket: WebSocket | null; // Use WebSocket.readyState read-only property returns the current state of the WebSocket connection
  setSocket: (socket: WebSocket) => void;
  // Commands to broadcast
  // trackTimeSeconds is the number of seconds into the track to play at (ie. location of the slider)
  broadcastPlay: (trackTimeSeconds?: number) => void;
  broadcastPause: () => void;
  startSpatialAudio: () => void;
  stopSpatialAudio: () => void;
  spatialConfig?: SpatialConfigType;
  setSpatialConfig: (config: SpatialConfigType) => void;
  updateListeningSource: (position: PositionType) => void;
  listeningSourcePosition: PositionType;
  setListeningSourcePosition: (position: PositionType) => void;
  isDraggingListeningSource: boolean;
  setIsDraggingListeningSource: (isDragging: boolean) => void;

  // Connected clients
  connectedClients: ClientType[];
  setConnectedClients: (clients: ClientType[]) => void;

  // NTP
  sendNTPRequest: () => void;
  resetNTPConfig: () => void;
  ntpMeasurements: NTPMeasurement[];
  addNTPMeasurement: (measurement: NTPMeasurement) => void;
  offsetEstimate: number;
  roundTripEstimate: number;
  isSynced: boolean;

  // Audio Player
  audioPlayer: AudioPlayerState | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playAudio: (data: {
    offset: number;
    when: number;
    audioIndex?: number;
  }) => void;
  processSpatialConfig: (config: SpatialConfigType) => void;

  // When to pause in relative seconds from now
  pauseAudio: (data: { when: number }) => void;
  // reset: () => void;
  // seekTo: (time: number) => void;
  // setVolume: (volume: number) => void; // Set volume out of 1

  // Add these tracking properties
  playbackStartTime: number; // AudioContext time when playback started
  playbackOffset: number; // Offset in seconds into the track when playback started

  // Add function to get current position
  getCurrentTrackPosition: () => number;

  // Shuffle state
  isShuffled: boolean;
  toggleShuffle: () => void;

  // Add these functions for track skipping
  skipToNextTrack: (isAutoplay?: boolean) => void;
  skipToPreviousTrack: () => void;
}

// Audio sources
const STATIC_AUDIO_SOURCES: StaticAudioSource[] = [
  {
    name: "Black Coast - TRNDSTTR (Lucian Remix)",
    url: "/trndsttr.mp3",
    id: "static-0",
  },
  {
    name: "Porter Robinson ft. Amy Millan - Divinity (Official Audio)",
    url: "/Porter Robinson ft. Amy Millan - Divinity (Official Audio).mp3",
    id: "static-1",
  },
  {
    name: "INZO x ILLUSIO - Just A Mirage",
    url: "/INZO x ILLUSIO - Just A Mirage.mp3",
    id: "static-2",
  },
  {
    name: "DROELOE x San Holo - Lines of the Broken (ft. CUT)",
    url: "/DROELOE x San Holo - Lines of the Broken (ft. CUT).mp3",
    id: "static-3",
  },
  {
    name: "Snavs - Lust",
    url: "/Snavs - Lust.mp3",
    id: "static-4",
  },
  {
    name: "joyful - chess (slowed)",
    url: "/joyful - chess (slowed).mp3",
    id: "static-5",
  },
];

const getAudioPlayer = (state: GlobalState) => {
  if (!state.audioPlayer) {
    throw new Error(AudioPlayerError.NotInitialized);
  }
  return state.audioPlayer;
};

const getSocket = (state: GlobalState) => {
  if (!state.socket) {
    throw new Error("Socket not initialized");
  }
  return {
    socket: state.socket,
  };
};

const getWaitTimeSeconds = (state: GlobalState, targetServerTime: number) => {
  const { offsetEstimate } = state;
  return calculateWaitTimeMilliseconds(targetServerTime, offsetEstimate) / 1000;
};

export const initializeAudioSources = async (
  audioContext: AudioContext
): Promise<Array<LocalAudioSource>> => {
  // Get the ArrayBuffers for each source
  return Promise.all(
    STATIC_AUDIO_SOURCES.map(async (source) => {
      const response = await fetch(source.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return {
        name: source.name,
        audioBuffer,
        id: source.id,
      };
    })
  );
};

// Web audio API
const initializeAudioContext = () => {
  const audioContext = new AudioContext();
  return audioContext;
};

export const useGlobalStore = create<GlobalState>((set, get) => {
  // Load audio sources if we're in the browser
  if (typeof window !== "undefined") {
    const initializeAudio = async () => {
      const audioContext = initializeAudioContext();
      const sources = await initializeAudioSources(audioContext);
      console.log(`Loaded initial audio sources ${sources.length}`);

      // Create master gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1; // Default volume
      const sourceNode = audioContext.createBufferSource();

      // Decode initial first audio source
      sourceNode.buffer = sources[0].audioBuffer;
      sourceNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      set({
        audioSources: sources,
        audioPlayer: {
          audioContext,
          sourceNode,
          gainNode,
        },
        downloadedAudioIds: new Set<string>(),
        duration: sources[0].audioBuffer.duration,
      });
    };

    initializeAudio();
  }

  return {
    // Audio Sources
    audioSources: [],
    isLoadingAudio: true,
    selectedAudioId: STATIC_AUDIO_SOURCES[0].id,
    uploadHistory: [],
    downloadedAudioIds: new Set<string>(),
    addToUploadHistory: (name, id) =>
      set((state) => ({
        uploadHistory: [
          ...state.uploadHistory,
          { name, timestamp: Date.now(), id },
        ],
      })),
    reuploadAudio: (audioId, audioName) => {
      const state = get();
      const { socket } = getSocket(state);

      sendWSRequest({
        ws: socket,
        request: {
          type: ClientActionEnum.enum.REUPLOAD_AUDIO,
          audioId,
          audioName,
        },
      });
    },
    hasDownloadedAudio: (id) => {
      const state = get();
      return state.downloadedAudioIds.has(id);
    },
    markAudioAsDownloaded: (id) => {
      set((state) => {
        const newSet = new Set(state.downloadedAudioIds);
        newSet.add(id);
        return { downloadedAudioIds: newSet };
      });
    },
    setAudioSources: (sources) => set({ audioSources: sources }),
    addAudioSource: async (source: RawAudioSource) => {
      const state = get();
      const { audioContext } = state.audioPlayer || {
        audioContext: new AudioContext(),
      };

      try {
        const audioBuffer = await audioContext.decodeAudioData(
          source.audioBuffer
        );
        console.log(
          "Decoded audio setting state to add audio source",
          source.name
        );

        // Add to upload history when adding an audio source
        // If this has an ID, mark it as downloaded
        state.markAudioAsDownloaded(source.id);
        state.addToUploadHistory(source.name, source.id);

        const newAudioSource = {
          name: source.name,
          audioBuffer,
          id: source.id,
        };

        set((state) => {
          // If this is the currently selected audio, update the duration
          const shouldUpdateDuration = source.id === state.selectedAudioId;

          return {
            audioSources: [...state.audioSources, newAudioSource],
            ...(shouldUpdateDuration ? { duration: audioBuffer.duration } : {}),
          };
        });
      } catch (error) {
        console.error("Failed to decode audio data:", error);
      }
    },
    setSpatialConfig: (spatialConfig) => set({ spatialConfig }),
    updateListeningSource: ({ x, y }) => {
      const state = get();
      const { socket } = getSocket(state);

      // Update local state
      set({ listeningSourcePosition: { x, y } });

      sendWSRequest({
        ws: socket,
        request: { type: ClientActionEnum.enum.SET_LISTENING_SOURCE, x, y },
      });
    },
    setIsLoadingAudio: (isLoading) => set({ isLoadingAudio: isLoading }),
    setSelectedAudioId: (audioId) => {
      const state = get();
      const wasPlaying = state.isPlaying; // Store if it was playing *before* stopping

      // Stop any current playback immediately when switching tracks
      if (state.isPlaying && state.audioPlayer) {
        try {
          state.audioPlayer.sourceNode.stop();
        } catch (e) {
          // Ignore errors if already stopped or not initialized
        }
      }

      // Find the new audio source for duration
      const audioIndex = state.findAudioIndexById(audioId);
      let newDuration = 0;
      if (audioIndex !== null) {
        const audioSource = state.audioSources[audioIndex];
        if (audioSource?.audioBuffer) {
          newDuration = audioSource.audioBuffer.duration;
        }
      }

      // Reset timing state and update selected ID
      set({
        selectedAudioId: audioId,
        isPlaying: false, // Always stop playback on track change before potentially restarting
        currentTime: 0,
        playbackStartTime: 0,
        playbackOffset: 0,
        duration: newDuration,
      });

      // Return the previous playing state for the skip functions to use
      return wasPlaying;
    },
    findAudioIndexById: (audioId: string) => {
      const state = get();
      // Look through the audioSources for a matching ID
      const index = state.audioSources.findIndex(
        (source) => source.id === audioId
      );
      return index >= 0 ? index : null; // Return null if not found
    },
    schedulePlay: (data: {
      trackTimeSeconds: number;
      targetServerTime: number;
      audioId: string;
    }) => {
      const state = get();
      if (state.isLoadingAudio) {
        console.log("Not playing audio, still loading");
        // Non-interactive state, can't play audio
        return;
      }

      const waitTimeSeconds = getWaitTimeSeconds(state, data.targetServerTime);
      console.log(
        `Playing track ${data.audioId} at ${data.trackTimeSeconds} seconds in ${waitTimeSeconds}`
      );

      // Update the selected audio ID
      if (data.audioId !== state.selectedAudioId) {
        set({ selectedAudioId: data.audioId });
      }

      // Find the index of the audio to play
      const audioIndex = state.findAudioIndexById(data.audioId);
      if (audioIndex === null) {
        console.error(
          `Cannot play audio: No index found: ${data.audioId} ${data.trackTimeSeconds}`
        );
        toast.error("Audio file not found. Please reupload the audio file.");
        return;
      }

      state.playAudio({
        offset: data.trackTimeSeconds,
        when: waitTimeSeconds,
        audioIndex, // Pass the found index for actual playback
      });
    },
    schedulePause: ({ targetServerTime }: { targetServerTime: number }) => {
      const state = get();
      const waitTimeSeconds = getWaitTimeSeconds(state, targetServerTime);
      console.log(`Pausing track in ${waitTimeSeconds}`);

      state.pauseAudio({
        when: waitTimeSeconds,
      });
    },

    // Websocket
    socket: null,
    setSocket: (socket) => set({ socket }),

    // Commands to broadcast
    broadcastPlay: (trackTimeSeconds?: number) => {
      const state = get();
      const { socket } = getSocket(state);

      // Make sure we have a selected audio ID
      if (!state.selectedAudioId) {
        console.error("Cannot broadcast play: No audio selected");
        return;
      }

      sendWSRequest({
        ws: socket,
        request: {
          type: ClientActionEnum.enum.PLAY,
          trackTimeSeconds: trackTimeSeconds ?? state.getCurrentTrackPosition(),
          audioId: state.selectedAudioId,
        },
      });
    },

    broadcastPause: () => {
      const state = get();
      const { socket } = getSocket(state);

      sendWSRequest({
        ws: socket,
        request: {
          type: ClientActionEnum.enum.PAUSE,
        },
      });
    },

    startSpatialAudio: () => {
      const state = get();
      const { socket } = getSocket(state);

      sendWSRequest({
        ws: socket,
        request: {
          type: ClientActionEnum.enum.START_SPATIAL_AUDIO,
        },
      });
    },

    stopSpatialAudio: () => {
      const state = get();
      const { socket } = getSocket(state);

      sendWSRequest({
        ws: socket,
        request: {
          type: ClientActionEnum.enum.STOP_SPATIAL_AUDIO,
        },
      });

      // Reset gain node to 0.8
      const { gainNode } = getAudioPlayer(state);
      gainNode.gain.value = 1;

      set({ spatialConfig: undefined });
    },

    // NTP
    isSynced: false,
    sendNTPRequest: () => {
      const state = get();
      if (state.ntpMeasurements.length >= MAX_NTP_MEASUREMENTS) {
        const { averageOffset, averageRoundTrip } = calculateOffsetEstimate(
          state.ntpMeasurements
        );
        set({
          offsetEstimate: averageOffset,
          roundTripEstimate: averageRoundTrip,
          isSynced: true,
        });
        return;
      }

      // Otherwise not done, keep sending
      const { socket } = getSocket(state);

      // Send the first one
      _sendNTPRequest(socket);
    },

    resetNTPConfig() {
      set({
        ntpMeasurements: [],
        offsetEstimate: 0,
        roundTripEstimate: 0,
        isSynced: false,
      });
    },

    // NTP
    ntpMeasurements: [],
    addNTPMeasurement: (measurement) =>
      set((state) => ({
        ntpMeasurements: [...state.ntpMeasurements, measurement],
      })),
    offsetEstimate: 0,
    roundTripEstimate: 0,

    // Audio Player
    audioPlayer: null,
    isPlaying: false,

    currentTime: 0,
    duration: 0,
    volume: 0.5,

    // Initialize new tracking properties
    playbackStartTime: 0,
    playbackOffset: 0,

    // Get current track position at any time
    getCurrentTrackPosition: () => {
      const state = get();
      const {
        audioPlayer,
        isPlaying,
        currentTime,
        playbackStartTime,
        playbackOffset,
      } = state; // Destructure for easier access

      if (!isPlaying || !audioPlayer) {
        return currentTime; // Return the saved position when paused or not initialized
      }

      const { audioContext } = audioPlayer;
      const elapsedSinceStart = audioContext.currentTime - playbackStartTime;
      // Ensure position doesn't exceed duration due to timing glitches
      return Math.min(playbackOffset + elapsedSinceStart, state.duration);
    },

    // Play the current source
    playAudio: async (data: {
      offset: number;
      when: number;
      audioIndex?: number;
    }) => {
      const state = get();
      const { sourceNode, audioContext, gainNode } = getAudioPlayer(state);

      // Before any audio playback, ensure the context is running
      if (audioContext.state !== "running") {
        // This will resume a suspended context
        await audioContext.resume();
        console.log("Audio context resumed");
      }

      // Stop any existing source node before creating a new one
      try {
        sourceNode.stop();
      } catch (_) {}

      const startTime = audioContext.currentTime + data.when;
      const audioIndex = data.audioIndex ?? 0;
      const audioBuffer = state.audioSources[audioIndex].audioBuffer;

      // Create a new source node
      const newSourceNode = audioContext.createBufferSource();
      newSourceNode.buffer = audioBuffer;
      newSourceNode.connect(gainNode);

      // Autoplay: Handle track ending naturally
      newSourceNode.onended = () => {
        const currentState = get();
        const { audioPlayer: currentPlayer, isPlaying: currentlyIsPlaying } =
          currentState; // Get fresh state

        // Only process if the player was 'isPlaying' right before this event fired
        // and the sourceNode that ended is the *current* sourceNode.
        // This prevents handlers from old nodes interfering after a quick skip.
        if (currentlyIsPlaying && currentPlayer?.sourceNode === newSourceNode) {
          const { audioContext } = currentPlayer;
          // Check if the buffer naturally reached its end
          // Calculate the expected end time in the AudioContext timeline
          const expectedEndTime =
            currentState.playbackStartTime +
            (currentState.duration - currentState.playbackOffset);
          // Use a tolerance for timing discrepancies (e.g., 0.5 seconds)
          const endedNaturally =
            Math.abs(audioContext.currentTime - expectedEndTime) < 0.5;

          if (endedNaturally) {
            console.log(
              "Track ended naturally, skipping to next via autoplay."
            );
            // Set currentTime to duration, as playback fully completed
            // We don't set isPlaying false here, let skipToNextTrack handle state transition
            set({ currentTime: currentState.duration });
            currentState.skipToNextTrack(true); // Trigger autoplay skip
          } else {
            console.log(
              "onended fired but not deemed a natural end (likely manual stop/skip). State should be handled elsewhere."
            );
            // If stopped manually (pauseAudio) or skipped (setSelectedAudioId),
            // those functions are responsible for setting isPlaying = false and currentTime.
            // No action needed here for non-natural ends.
          }
        } else {
          console.log(
            "onended fired but player was already stopped/paused or source node changed."
          );
        }
      };

      newSourceNode.start(startTime, data.offset);
      console.log(
        "Started playback at offset:",
        data.offset,
        "with delay:",
        data.when,
        "audio index:",
        audioIndex
      );

      // Update state with the new source node and tracking info
      set((state) => ({
        ...state,
        audioPlayer: {
          ...state.audioPlayer!,
          sourceNode: newSourceNode,
        },
        isPlaying: true,
        playbackStartTime: startTime,
        playbackOffset: data.offset,
        duration: audioBuffer.duration || 0, // Set the duration
      }));
    },

    processSpatialConfig: (config: SpatialConfigType) => {
      const state = get();
      set({ spatialConfig: config });
      const { gains, listeningSource } = config;

      // Don't set if we were the ones dragging the listening source
      if (!state.isDraggingListeningSource) {
        set({ listeningSourcePosition: listeningSource });
      }

      // Extract out what this client's gain is:
      const userId = useRoomStore.getState().userId;
      const user = gains[userId];
      const { gain, rampTime } = user;

      // Process
      const { audioContext, gainNode } = getAudioPlayer(state);

      const now = audioContext.currentTime;
      const currentGain = gainNode.gain.value;

      // Reset
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(currentGain, now);

      // Ramp time is set server side
      gainNode.gain.linearRampToValueAtTime(gain, now + rampTime);
    },

    // Pause playback
    pauseAudio: (data: { when: number }) => {
      const state = get();
      const { sourceNode, audioContext } = getAudioPlayer(state);

      const stopTime = audioContext.currentTime + data.when;
      sourceNode.stop(stopTime);

      // Calculate current position in the track at the time of pausing
      const elapsedSinceStart = stopTime - state.playbackStartTime;
      const currentTrackPosition = state.playbackOffset + elapsedSinceStart;

      console.log(
        "Stopping at:",
        data.when,
        "Current track position:",
        currentTrackPosition
      );

      set((state) => ({
        ...state,
        isPlaying: false,
        currentTime: currentTrackPosition,
      }));
    },

    listeningSourcePosition: { x: GRID.SIZE / 2, y: GRID.SIZE / 2 },
    setListeningSourcePosition: (position: PositionType) => {
      set({ listeningSourcePosition: position });
    },

    isDraggingListeningSource: false,
    setIsDraggingListeningSource: (isDragging) => {
      set({ isDraggingListeningSource: isDragging });
    },

    // Connected clients
    connectedClients: [],
    setConnectedClients: (clients) => set({ connectedClients: clients }),
    skipToNextTrack: (isAutoplay = false) => {
      // Accept optional isAutoplay flag
      const state = get();
      const { audioSources, selectedAudioId, isShuffled } = state;
      if (audioSources.length <= 1) return; // Can't skip if only one track

      const currentIndex = state.findAudioIndexById(selectedAudioId);
      if (currentIndex === null) return;

      let nextIndex: number;
      if (isShuffled) {
        // Shuffle logic: pick a random index DIFFERENT from the current one
        do {
          nextIndex = Math.floor(Math.random() * audioSources.length);
        } while (nextIndex === currentIndex);
      } else {
        // Normal sequential logic
        nextIndex = (currentIndex + 1) % audioSources.length;
      }

      const nextAudioId = audioSources[nextIndex].id;
      // setSelectedAudioId stops any current playback and sets isPlaying to false.
      // It returns true if playback was active *before* this function was called.
      const wasPlayingBeforeSkip = state.setSelectedAudioId(nextAudioId);

      // If the track was playing before a manual skip OR if this is an autoplay event,
      // start playing the next track from the beginning.
      if (wasPlayingBeforeSkip || isAutoplay) {
        console.log(
          `Skip to next: ${nextAudioId}. Was playing: ${wasPlayingBeforeSkip}, Is autoplay: ${isAutoplay}. Broadcasting play.`
        );
        state.broadcastPlay(0); // Play next track from start
      } else {
        console.log(
          `Skip to next: ${nextAudioId}. Was playing: ${wasPlayingBeforeSkip}, Is autoplay: ${isAutoplay}. Not broadcasting play.`
        );
      }
    },

    skipToPreviousTrack: () => {
      const state = get();
      const { audioSources, selectedAudioId /* isShuffled */ } = state; // Note: isShuffled is NOT used here currently
      if (audioSources.length === 0) return;

      const currentIndex = state.findAudioIndexById(selectedAudioId);
      if (currentIndex === null) return;

      // Previous track always goes to the actual previous in the list, even if shuffled
      // This is a common behavior, but could be changed if needed.
      const prevIndex =
        (currentIndex - 1 + audioSources.length) % audioSources.length;
      const prevAudioId = audioSources[prevIndex].id;

      // setSelectedAudioId stops any current playback and sets isPlaying to false.
      // It returns true if playback was active *before* this function was called.
      const wasPlayingBeforeSkip = state.setSelectedAudioId(prevAudioId);

      // If the track was playing before the manual skip, start playing the previous track.
      if (wasPlayingBeforeSkip) {
        console.log(
          `Skip to previous: ${prevAudioId}. Was playing: ${wasPlayingBeforeSkip}. Broadcasting play.`
        );
        state.broadcastPlay(0); // Play previous track from start
      } else {
        console.log(
          `Skip to previous: ${prevAudioId}. Was playing: ${wasPlayingBeforeSkip}. Not broadcasting play.`
        );
      }
    },

    // Shuffle state
    isShuffled: false,
    toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  };
});
