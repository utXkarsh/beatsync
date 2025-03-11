import { errorResponse } from "../utils/responses";

export const handleWebSocketUpgrade = (req: Request, server: any) => {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId");
  const userId = url.searchParams.get("userId");
  const username = url.searchParams.get("username");

  if (!roomId || !userId || !username) {
    // Check which parameters are missing and log them
    const missingParams = [];

    if (!roomId) missingParams.push("roomId");
    if (!userId) missingParams.push("userId");
    if (!username) missingParams.push("username");

    console.log(
      `WebSocket connection attempt missing parameters: ${missingParams.join(
        ", "
      )}`
    );

    return errorResponse("roomId and userId are required");
  }

  console.log(`User ${username} joined room ${roomId} with userId ${userId}`);

  // Upgrade the connection with the WSData context
  const upgraded = server.upgrade(req, {
    data: {
      roomId,
      userId,
      username,
    },
  });

  if (!upgraded) {
    return errorResponse("WebSocket upgrade failed");
  }

  return undefined;
};
