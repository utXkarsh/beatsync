import { calculateWaitTime } from "@/utils/time";
import { serializeMessage } from "@/utils/websocket";
import { Action } from "@shared/types";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useAudioSources } from "./useAudioSources";

export const useAudioPlayback = (
  socketRef: RefObject<WebSocket | null>,
  averageOffset: number | null
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [loadingState, setLoadingState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const { audioSources, isLoadingAudioSources } = useAudioSources();
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number>(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [totalNudge, setTotalNudge] = useState<number>(0);

  // Initialize Audio Context and load audio
  useEffect(() => {
    if (isLoadingAudioSources) {
      return;
    }

    const AudioContext = window.AudioContext;
    const context = new AudioContext();
    audioContextRef.current = context;

    // Create gain node for volume control
    const gainNode = context.createGain();
    gainNode.connect(context.destination);
    gainNodeRef.current = gainNode;

    // Set initial volume based on mute state
    gainNode.gain.value = isMuted ? 0 : 1;

    // Load and decode audio file
    const loadAudio = async () => {
      try {
        setLoadingState("loading");
        const currentSource = audioSources[selectedSourceIndex];
        if (!currentSource || !currentSource.buffer) {
          throw new Error("No audio source or buffer available");
        }

        const audioBuffer = await audioContextRef.current!.decodeAudioData(
          currentSource.buffer
        );
        audioBufferRef.current = audioBuffer;
        setLoadingState("ready");
        console.log("Audio decoded and ready for precise playback");
      } catch (error) {
        console.error("Failed to load audio:", error);
        setLoadingState("error");
      }
    };

    loadAudio();

    return () => {
      if (context && context.state !== "closed") {
        context.close();
      }
    };
  }, [selectedSourceIndex, audioSources, isMuted, isLoadingAudioSources]);

  // Set up high precision playback time tracking using requestAnimationFrame
  useEffect(() => {
    const updatePlaybackTime = () => {
      const audioContext = audioContextRef.current;

      if (audioContext && startedAtRef.current !== null) {
        // We're playing - calculate precise position
        const currentPosition = audioContext.currentTime - startedAtRef.current;
        setCurrentPlaybackTime(currentPosition * 1000); // Convert to milliseconds
        setIsPlaying(true);
      } else if (pausedAtRef.current !== null) {
        // We're paused - show the paused position
        setCurrentPlaybackTime(pausedAtRef.current * 1000); // Convert to milliseconds
        setIsPlaying(false);
      } else {
        // Not playing or paused
        setIsPlaying(false);
      }

      requestAnimationFrame(updatePlaybackTime);
    };

    const animationId = requestAnimationFrame(updatePlaybackTime);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handlePlay = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(serializeMessage({ type: Action.Play }));
    }
  }, [socketRef]);

  const handlePause = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(serializeMessage({ type: Action.Pause }));
    }
  }, [socketRef]);

  const handleNudge = useCallback(
    (amount: number) => {
      const audioContext = audioContextRef.current;
      if (
        !audioContext ||
        !audioBufferRef.current ||
        !audioSourceRef.current ||
        startedAtRef.current === null
      ) {
        console.log("Cannot nudge: audio not playing");
        return;
      }

      try {
        // Calculate current position
        const currentPosition = audioContext.currentTime - startedAtRef.current;

        // Stop current playback
        audioSourceRef.current.stop();

        // Create new source and start at adjusted position
        const source = audioContext.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(gainNodeRef.current || audioContext.destination);

        // Convert amount from ms to seconds and calculate new position
        const skipAmount = amount / 1000;
        const newPosition = Math.max(0, currentPosition + skipAmount);

        // Start at the new position immediately
        source.start(0, newPosition);

        // Update refs
        audioSourceRef.current = source;
        startedAtRef.current = audioContext.currentTime - newPosition;

        // Update total nudge
        setTotalNudge((prev) => prev + amount);

        console.log(
          `Nudged by ${amount} ms, total nudge: ${totalNudge + amount} ms`
        );
      } catch (e) {
        console.error("Error nudging:", e);
      }
    },
    [totalNudge]
  );

  const handleToggleMute = useCallback(() => {
    const audioContext = audioContextRef.current;
    const gainNode = gainNodeRef.current;

    if (!audioContext || !gainNode) {
      console.error("Audio context or gain node not available");
      return;
    }

    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    gainNode.gain.setValueAtTime(
      newMuteState ? 0 : 1,
      audioContext.currentTime
    );

    console.log(`Audio ${newMuteState ? "muted" : "unmuted"}`);
  }, [isMuted]);

  const handleTrackChange = useCallback(
    (index: number) => {
      if (index < 0 || index >= audioSources.length) {
        console.error("Invalid track index");
        return;
      }

      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }

      startedAtRef.current = null;
      pausedAtRef.current = null;
      setIsPlaying(false);
      setSelectedSourceIndex(index);
    },
    [audioSources.length]
  );

  const handleServerAction = useCallback(
    (action: Action.Play | Action.Pause, targetServerTime: number) => {
      const audioContext = audioContextRef.current;
      if (!audioContext || !audioBufferRef.current) {
        console.error("Audio not ready yet");
        return;
      }

      const waitTime = calculateWaitTime(targetServerTime, averageOffset);
      console.log(`Scheduling ${action} to happen in ${waitTime}ms`);

      const audioContextTime = audioContext.currentTime + waitTime / 1000;

      if (action === Action.Play) {
        if (audioSourceRef.current) {
          audioSourceRef.current.stop();
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(gainNodeRef.current || audioContext.destination);
        audioSourceRef.current = source;

        let offset = 0;
        if (pausedAtRef.current !== null) {
          offset = pausedAtRef.current;
          pausedAtRef.current = null;
        } else if (targetServerTime < Date.now() + (averageOffset || 0)) {
          const elapsedServerTime =
            (Date.now() + (averageOffset || 0) - targetServerTime) / 1000;
          offset = Math.max(0, elapsedServerTime);
        }

        startedAtRef.current = audioContextTime - offset;
        source.start(audioContextTime, offset);
      } else if (action === Action.Pause) {
        if (audioSourceRef.current && startedAtRef.current !== null) {
          try {
            audioSourceRef.current.stop(audioContextTime);
            const pausePosition = audioContextTime - startedAtRef.current;
            pausedAtRef.current = pausePosition;
            startedAtRef.current = null;
          } catch (e) {
            console.error("Error pausing:", e);
          }
        }
      }
    },
    [averageOffset]
  );

  return {
    loadingState,
    isPlaying,
    isMuted,
    currentPlaybackTime,
    totalNudge,
    audioSources,
    selectedSourceIndex,
    handlePlay,
    handlePause,
    handleNudge,
    handleToggleMute,
    handleTrackChange,
    handleServerAction,
  };
};
