import { LocalAudioSource } from "@/lib/localTypes";
import { useEffect } from "react";
import { create } from "zustand";

interface StaticAudioSource {
  name: string;
  url: string;
}

interface AudioSourcesState {
  audioSources: LocalAudioSource[];
  isLoadingAudioSources: boolean;
  selectedSourceIndex: number;
  setAudioSources: (sources: LocalAudioSource[]) => void;
  addAudioSource: (source: LocalAudioSource) => void;
  setIsLoadingAudioSources: (isLoading: boolean) => void;
  setSelectedSourceIndex: (index: number) => void;
}

const STATIC_AUDIO_SOURCES: StaticAudioSource[] = [
  { name: "Trndsttr (Lucian Remix)", url: "/trndsttr.mp3" },
  { name: "Wonder", url: "/wonder.mp3" },
  { name: "Chess", url: "/chess.mp3" },
];

export const getInitialAudioSources = async (): Promise<
  Array<LocalAudioSource>
> => {
  // Get the ArrayBuffers for each source
  return Promise.all(
    STATIC_AUDIO_SOURCES.map(async (source) => {
      const response = await fetch(source.url);
      return {
        name: source.name,
        buffer: await response.arrayBuffer(),
      };
    })
  );
};

export const useAudioSourcesStore = create<AudioSourcesState>((set) => ({
  audioSources: [],
  isLoadingAudioSources: true,
  selectedSourceIndex: 0,
  setAudioSources: (sources) => set({ audioSources: sources }),
  addAudioSource: (source: LocalAudioSource) =>
    set((state) => ({
      audioSources: [...state.audioSources, source],
    })),
  setIsLoadingAudioSources: (isLoading) =>
    set({ isLoadingAudioSources: isLoading }),
  setSelectedSourceIndex: (index) => set({ selectedSourceIndex: index }),
}));

export const useAudioSources = () => {
  const audioSources = useAudioSourcesStore((state) => state.audioSources);
  const isLoadingAudioSources = useAudioSourcesStore(
    (state) => state.isLoadingAudioSources
  );
  const selectedSourceIndex = useAudioSourcesStore(
    (state) => state.selectedSourceIndex
  );
  const setAudioSources = useAudioSourcesStore(
    (state) => state.setAudioSources
  );
  const addAudioSource = useAudioSourcesStore((state) => state.addAudioSource);
  const setIsLoadingAudioSources = useAudioSourcesStore(
    (state) => state.setIsLoadingAudioSources
  );
  const setSelectedSourceIndex = useAudioSourcesStore(
    (state) => state.setSelectedSourceIndex
  );

  useEffect(() => {
    const loadAudioSources = async () => {
      const sources = await getInitialAudioSources();
      setAudioSources(sources);
      setIsLoadingAudioSources(false);
    };

    if (audioSources.length === 0) {
      loadAudioSources();
    }
  }, [audioSources.length, setAudioSources, setIsLoadingAudioSources]);

  return {
    audioSources,
    setAudioSources,
    addAudioSource,
    isLoadingAudioSources,
    selectedSourceIndex,
    setSelectedSourceIndex,
  };
};
