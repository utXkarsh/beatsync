export interface LocalAudioSource {
  name: string;
  audioBuffer: AudioBuffer;
}

export interface RawAudioSource {
  name: string;
  audioBuffer: ArrayBuffer;
}
