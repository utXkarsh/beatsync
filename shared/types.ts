export enum Action {
  Play = "play",
  Pause = "pause",
  Join = "join",
  NTPRequest = "ntp_request",
  NTPResponse = "ntp_response",
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

export type ServerMessage = BaseServerMessage | NTPResponseMessage;
