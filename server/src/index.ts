import type { ServerWebSocket } from "bun";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const app = new Hono();
const clients = new Set<WSContext<ServerWebSocket>>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        // Broadcast the message to all connected clients
        const message = event.data.toString();
        console.log(`Broadcasting message to ${clients.size} clients`);
        clients.forEach((client) => {
          client.send(message);
        });
      },
      onClose: (event, ws) => {
        console.log("Connection closed");
        clients.delete(ws);
      },
      onOpen: (event, ws) => {
        console.log(`Connection opened`);
        clients.add(ws);
      },
      onError: (error) => {
        console.error("Error", error);
      },
    };
  })
);

export default {
  port: 8080,
  fetch: app.fetch,
  websocket,
};
