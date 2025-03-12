import { WSRequest } from "@beatsync/shared";

export const deserializeMessage = (message: string): WSRequest => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};
