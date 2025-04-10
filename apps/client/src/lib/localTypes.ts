export interface LocalAudioSource {
  name: string;
  audioBuffer: AudioBuffer;
}

export interface RawAudioSource {
  name: string;
  audioBuffer: ArrayBuffer;
  id: string; // Optional ID for tracking downloaded audio files
}
