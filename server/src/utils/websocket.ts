import { ClientMessage } from "@shared/types";

export interface WSData {
  roomId: string;
  userId: string;
  username: string;
}

export const deserializeMessage = (message: string): ClientMessage => {
  const parsedMessage = JSON.parse(message.toString());
  return parsedMessage;
};
