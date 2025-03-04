export enum Action {
  Play = "play",
  Pause = "pause",
  Join = "join",
}
export interface ClientMessage {
  type: Action;
}
export interface ServerMessage {
  type: Action;
  timestamp: number; // Server timestamp in milliseconds
  serverTime: number; // Optional server time for synchronization
}
