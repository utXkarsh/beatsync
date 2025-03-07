export enum Action {
  Play = "play",
  Pause = "pause",
  Join = "join",
  NTPRequest = "ntp_request",
  NTPResponse = "ntp_response",
  NewAudioSource = "new_audio_source",
}

// Audio source information
export interface AudioSource {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail?: string;
  addedAt: number;
}

export interface ClientMessage {
  type: Action;
}

export interface NTPRequestMessage extends ClientMessage {
  type: Action.NTPRequest;
  t0: number; // Client send timestamp
}

export interface BaseServerMessage {
  type: Action;
  timestamp: number; // Timestamp to take action at
  serverTime: number; // Server time
}

export interface NTPResponseMessage {
  type: Action.NTPResponse;
  t0: number; // Client send timestamp (echoed back)
  t1: number; // Server receive timestamp
  t2: number; // Server send timestamp
}

// New message type for audio source notification
export interface NewAudioSourceMessage extends BaseServerMessage {
  type: Action.NewAudioSource;
  source: AudioSource;
}

export type ServerMessage =
  | BaseServerMessage
  | NTPResponseMessage
  | NewAudioSourceMessage;
