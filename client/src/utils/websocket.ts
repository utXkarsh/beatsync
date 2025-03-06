import { ClientMessage, ServerMessage } from "@shared/types";

/**
 * Deserialize a message from the server
 */
export const deserializeMessage = (message: string): ServerMessage => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};

/**
 * Serialize a message to send to the server
 */
export const serializeMessage = (message: ClientMessage): string => {
  return JSON.stringify(message);
};
