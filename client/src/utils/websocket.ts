import { WSMessage } from "@shared/types";

export const deserializeMessage = (message: string): WSMessage => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};
