import { WSMessage } from "@beatsync/shared";

export const deserializeMessage = (message: string): WSMessage => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};
