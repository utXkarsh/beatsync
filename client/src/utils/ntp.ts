import { ClientActionEnum, WSMessage } from "@shared/types";

export interface NTPMeasurement {
  t0: number;
  t1: number;
  t2: number;
  t3: number;
  roundTripDelay: number;
  clockOffset: number;
}

export const _sendNTPRequest = (ws: WebSocket) => {
  if (ws.readyState !== WebSocket.OPEN) {
    throw new Error("Cannot send NTP request: WebSocket is not open");
  }

  const t0 = Date.now();
  const message: WSMessage = {
    type: ClientActionEnum.enum.NTP_REQUEST,
    t0,
  };
  ws.send(JSON.stringify(message));
};

export const calculateWaitTime = (
  targetServerTime: number,
  clockOffset: number | null
): number => {
  const estimatedCurrentServerTime = Date.now() + (clockOffset || 0);
  return Math.max(0, targetServerTime - estimatedCurrentServerTime);
};
