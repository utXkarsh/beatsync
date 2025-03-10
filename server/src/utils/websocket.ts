import { WSMessage, WSRequestSchema } from "@shared/types";

export interface WSData {
  roomId: string;
  userId: string;
  username: string;
}

export const deserializeMessage = (message: string): WSMessage => {
  return WSRequestSchema.parse(JSON.parse(message));
};
