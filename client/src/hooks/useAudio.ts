import { AudioLoadingState } from "@/types/audio";
import { Action } from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [loadingState, setLoadingState] =
    useState<AudioLoadingState>("loading");
  const [selectedTrack, setSelectedTrack] = useState<string>("/trndsttr.mp3");
  const [totalNudge, setTotalNudge] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const [nudgeAmount, setNudgeAmount] = useState<number>(10);

  // Initialize Audio Context and load audio
  useEffect(() => {
    // Create Audio Context
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
        const response = await fetch(selectedTrack);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
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
  }, [selectedTrack, isMuted]);

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

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);

    // Clean up
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle scheduled actions from the server
  const handleScheduledAction = useCallback(
    (
      action: Action,
      targetServerTime: number,
      waitTime: number,
      offset?: number
    ) => {
      const audioContext = audioContextRef.current;
      if (!audioContext || !audioBufferRef.current) {
        console.error("Audio not ready yet");
        return;
      }

      // Calculate the exact audio context time to start/stop playback
      const audioContextTime = audioContext.currentTime + waitTime / 1000;

      if (action === Action.Play) {
        // Stop current source if any
        if (audioSourceRef.current) {
          audioSourceRef.current.stop();
        }

        // Create new audio source node
        const source = audioContext.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(gainNodeRef.current || audioContext.destination);
        audioSourceRef.current = source;

        // Calculate where to start playing from
        let startOffset = 0;
        if (pausedAtRef.current !== null) {
          startOffset = pausedAtRef.current;
          pausedAtRef.current = null;
        } else if (offset !== undefined) {
          // If we're joining late and the audio should already be playing,
          // calculate how far into the audio we should start
          startOffset = Math.max(0, offset);
          console.log(`Late join - starting ${startOffset}s into audio`);
        }

        // Schedule precise playback
        startedAtRef.current = audioContextTime - startOffset;
        console.log(
          `Starting playback at context time ${audioContextTime}, offset ${startOffset}`
        );
        source.start(audioContextTime, startOffset);

        // Log when playback actually starts
        setTimeout(() => {
          console.log("Play scheduled to start at:", audioContextTime);
          console.log("Actual context time now:", audioContext.currentTime);
        }, waitTime);
      } else if (action === Action.Pause) {
        if (audioSourceRef.current && startedAtRef.current !== null) {
          try {
            // Schedule the stop
            audioSourceRef.current.stop(audioContextTime);

            // Calculate where we'll be in the audio when we pause
            const pausePosition = audioContextTime - startedAtRef.current;
            pausedAtRef.current = pausePosition;
            startedAtRef.current = null;

            console.log(`Pausing at position ${pausePosition}s`);

            // Log when playback actually stops
            setTimeout(() => {
              console.log("Pause scheduled at:", audioContextTime);
              console.log("Actual context time now:", audioContext.currentTime);
            }, waitTime);
          } catch (e) {
            console.error("Error pausing:", e);
          }
        }
      }
    },
    []
  );

  // Function to nudge audio forward (speed up) by pausing and restarting with a tiny offset
  const handleNudgeForward = useCallback(() => {
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

      // Create new source and start slightly ahead (nudge forward)
      const source = audioContext.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(gainNodeRef.current || audioContext.destination);

      // Skip ahead by nudgeAmount milliseconds (convert to seconds)
      const skipAmount = nudgeAmount / 1000;
      const newPosition = currentPosition + skipAmount;

      // Start at the new position immediately
      source.start(0, newPosition);

      // Update refs
      audioSourceRef.current = source;
      startedAtRef.current = audioContext.currentTime - newPosition;

      // Update total nudge
      setTotalNudge((prev) => prev + nudgeAmount);

      console.log(
        `Nudged forward by ${nudgeAmount} ms, total nudge: ${
          totalNudge + nudgeAmount
        } ms`
      );
    } catch (e) {
      console.error("Error nudging forward:", e);
    }
  }, [nudgeAmount, totalNudge]);

  // Function to nudge audio backward (slow down) by pausing and restarting with a tiny offset
  const handleNudgeBackward = useCallback(() => {
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

      // Create new source and start slightly behind (nudge backward)
      const source = audioContext.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(gainNodeRef.current || audioContext.destination);

      // Go back by nudgeAmount milliseconds (convert to seconds)
      const backAmount = nudgeAmount / 1000;
      const newPosition = Math.max(0, currentPosition - backAmount);

      // Start at the new position immediately
      source.start(0, newPosition);

      // Update refs
      audioSourceRef.current = source;
      startedAtRef.current = audioContext.currentTime - newPosition;

      // Update total nudge
      setTotalNudge((prev) => prev - nudgeAmount);

      console.log(
        `Nudged backward by ${nudgeAmount} ms, total nudge: ${
          totalNudge - nudgeAmount
        } ms`
      );
    } catch (e) {
      console.error("Error nudging backward:", e);
    }
  }, [nudgeAmount, totalNudge]);

  // Function to adjust the nudge amount
  const handleNudgeAmountChange = useCallback((newAmount: number) => {
    const validValues = [1, 5, 10, 20, 50, 100, 250, 500, 1000];

    // If the value is not in our predefined list, find the closest available option
    if (!validValues.includes(newAmount)) {
      const closest = validValues.reduce((prev, curr) => {
        return Math.abs(curr - newAmount) < Math.abs(prev - newAmount)
          ? curr
          : prev;
      });
      console.log(
        `Nudge amount ${newAmount} not in valid options, using closest value: ${closest}`
      );
      setNudgeAmount(closest);
    } else {
      setNudgeAmount(newAmount);
      console.log(`Nudge amount set to ${newAmount} ms`);
    }
  }, []);

  // Handle mute toggle
  const handleToggleMute = useCallback(() => {
    const audioContext = audioContextRef.current;
    const gainNode = gainNodeRef.current;

    if (!audioContext || !gainNode) {
      console.error("Audio context or gain node not available");
      return;
    }

    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    // Set gain to 0 when muted, 1 when unmuted
    gainNode.gain.setValueAtTime(
      newMuteState ? 0 : 1,
      audioContext.currentTime
    );

    console.log(`Audio ${newMuteState ? "muted" : "unmuted"}`);
  }, [isMuted]);

  // Handle track selection change
  const handleTrackChange = useCallback((track: string) => {
    // Stop current playback if any
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }

    // Reset playback state
    startedAtRef.current = null;
    pausedAtRef.current = null;
    setIsPlaying(false);

    // Set new track and reload audio
    setSelectedTrack(track);
  }, []);

  return {
    loadingState,
    selectedTrack,
    isMuted,
    isPlaying,
    currentPlaybackTime,
    totalNudge,
    nudgeAmount,
    handleScheduledAction,
    handleNudgeForward,
    handleNudgeBackward,
    handleNudgeAmountChange,
    handleToggleMute,
    handleTrackChange,
  };
};
