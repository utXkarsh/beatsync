/* eslint-disable @typescript-eslint/no-unused-vars */
import { LocalAudioSource, RawAudioSource } from "@/lib/localTypes";
import {
  NTPMeasurement,
  _sendNTPRequest,
  calculateOffsetEstimate,
  calculateWaitTimeMilliseconds,
} from "@/utils/ntp";
import { sendWSRequest } from "@/utils/ws";
import { ClientActionEnum } from "@beatsync/shared";
import { create } from "zustand";

export const MAX_NTP_MEASUREMENTS = 40;

// https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch02.html

interface StaticAudioSource {
  name: string;
  url: string;
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
  selectedSourceIndex: number;
  setAudioSources: (sources: LocalAudioSource[]) => void;
  addAudioSource: (source: RawAudioSource) => Promise<void>;
  setIsLoadingAudio: (isLoading: boolean) => void;
  setSelectedSourceIndex: (index: number) => void;
  schedulePlay: (data: {
    trackTimeSeconds: number;
    targetServerTime: number;
    trackIndex: number;
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

  // NTP
  sendNTPRequest: () => void;
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
  playAudio: (data: { offset: number; when: number }) => void; // time in seconds
  setGain: (gain: number) => void;

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
}

// Audio sources
const STATIC_AUDIO_SOURCES: StaticAudioSource[] = [
  { name: "Trndsttr (Lucian Remix)", url: "/trndsttr.mp3" },
  { name: "Wonder", url: "/wonder.mp3" },
  { name: "Chess", url: "/chess.mp3" },
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
      gainNode.gain.value = 1.0; // Default volume
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
      });
    };

    initializeAudio();
  }

  return {
    // Audio Sources
    audioSources: [],
    isLoadingAudio: true,
    selectedSourceIndex: 0,
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
        set((state) => ({
          audioSources: [
            ...state.audioSources,
            {
              name: source.name,
              audioBuffer,
            },
          ],
        }));
      } catch (error) {
        console.error("Failed to decode audio data:", error);
      }
    },
    setIsLoadingAudio: (isLoading) => set({ isLoadingAudio: isLoading }),
    setSelectedSourceIndex: (index) => {
      // Stop any current playback
      const state = get();
      if (state.isPlaying) {
        try {
          const { sourceNode } = getAudioPlayer(state);
          sourceNode.stop();
        } catch (e) {
          console.warn("Error stopping playback during track switch:", e);
        }
      }

      // Reset timing state
      set({
        selectedSourceIndex: index,
        isPlaying: false,
        currentTime: 0,
        playbackStartTime: 0,
        playbackOffset: 0,
      });
    },
    schedulePlay: (data: {
      trackTimeSeconds: number;
      targetServerTime: number;
      trackIndex: number;
    }) => {
      const state = get();
      const waitTimeSeconds = getWaitTimeSeconds(state, data.targetServerTime);
      console.log(
        `Playing track ${data.trackIndex} at ${data.trackTimeSeconds} seconds in ${waitTimeSeconds}`
      );

      // Update the selected source index if provided
      if (data.trackIndex !== state.selectedSourceIndex) {
        set({ selectedSourceIndex: data.trackIndex });
      }

      state.playAudio({
        offset: data.trackTimeSeconds,
        when: waitTimeSeconds,
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

      sendWSRequest({
        ws: socket,
        request: {
          type: ClientActionEnum.enum.PLAY,
          trackTimeSeconds: trackTimeSeconds ?? state.getCurrentTrackPosition(),
          trackIndex: state.selectedSourceIndex,
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
      if (!state.isPlaying) {
        return state.currentTime; // Return the saved position when paused
      }

      const { audioContext } = getAudioPlayer(state);
      const elapsedSinceStart =
        audioContext.currentTime - state.playbackStartTime;
      return state.playbackOffset + elapsedSinceStart;
    },

    // Play the current source
    playAudio: async ({ offset, when }: { offset: number; when: number }) => {
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

      const startTime = audioContext.currentTime + when;

      // Create a new source node
      const newSourceNode = audioContext.createBufferSource();
      newSourceNode.buffer =
        state.audioSources[state.selectedSourceIndex].audioBuffer;
      newSourceNode.connect(gainNode);
      newSourceNode.start(startTime, offset);
      console.log("Started playback at offset:", offset, "with delay:", when);

      // Update state with the new source node and tracking info
      set((state) => ({
        ...state,
        audioPlayer: {
          ...state.audioPlayer!,
          sourceNode: newSourceNode,
        },
        isPlaying: true,
        playbackStartTime: startTime,
        playbackOffset: offset,
      }));
    },

    setGain: (gain: number) => {
      const { audioContext, gainNode } = getAudioPlayer(get());

      // Get current time
      const now = audioContext.currentTime;

      // Get the current gain value
      const currentGain = gainNode.gain.value;

      // Cancel any scheduled changes
      gainNode.gain.cancelScheduledValues(now);

      // Set the current value
      gainNode.gain.setValueAtTime(currentGain, now);

      // Determine if we're increasing or decreasing volume
      if (gain > currentGain) {
        // Fast attack (volume increasing) - 0.2 seconds
        gainNode.gain.linearRampToValueAtTime(gain, now + 1);
        console.log(
          `Volume increasing: ${currentGain.toFixed(2)} → ${gain.toFixed(
            2
          )} in 0.2s`
        );
      } else {
        // Slow decay (volume decreasing) - 2.0 seconds
        gainNode.gain.exponentialRampToValueAtTime(gain, now + 1.5);
        console.log(
          `Volume decreasing: ${currentGain.toFixed(2)} → ${gain.toFixed(
            2
          )} in 1.0s`
        );
      }
    },

    // Pause playback
    pauseAudio: ({ when }) => {
      const state = get();
      const { sourceNode, audioContext } = getAudioPlayer(state);

      const stopTime = audioContext.currentTime + when;
      sourceNode.stop(stopTime);

      // Calculate current position in the track at the time of pausing
      const elapsedSinceStart = stopTime - state.playbackStartTime;
      const currentTrackPosition = state.playbackOffset + elapsedSinceStart;

      console.log(
        "Stopping at:",
        when,
        "Current track position:",
        currentTrackPosition
      );

      set((state) => ({
        ...state,
        isPlaying: false,
        currentTime: currentTrackPosition,
      }));
    },
  };
});
