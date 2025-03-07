import { ClientMessage, ServerMessage } from "@shared/types";

export const deserializeMessage = (message: string): ServerMessage => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};

export const serializeMessage = (message: ClientMessage): string => {
  return JSON.stringify(message);
};
