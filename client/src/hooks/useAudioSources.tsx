import { LocalAudioSource } from "@/lib/localTypes";
import { useEffect, useState } from "react";

interface StaticAudioSource {
  name: string;
  url: string;
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

export const useAudioSources = () => {
  const [audioSources, setAudioSources] = useState<LocalAudioSource[]>([]);
  const [isLoadingAudioSources, setIsLoadingAudioSources] =
    useState<boolean>(true);

  useEffect(() => {
    const loadAudioSources = async () => {
      setIsLoadingAudioSources(true);
      const sources = await getInitialAudioSources();
      setAudioSources(sources);
      setIsLoadingAudioSources(false);
    };

    loadAudioSources();
  }, []);

  const addAudioSource = (name: string, buffer: ArrayBuffer) => {
    setAudioSources((prev) => [...prev, { name, buffer }]);
  };

  return {
    audioSources,
    setAudioSources,
    addAudioSource,
    isLoadingAudioSources,
  };
};
