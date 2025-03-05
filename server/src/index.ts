import {
  Action,
  ClientMessage,
  NTPRequestMessage,
  ServerMessage,
} from "@shared/types";
const GLOBAL_TOPIC = "global";

// Track the current playback state

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
};

const deserializeMessage = (message: string): ClientMessage => {
  const parsedMessage = JSON.parse(message.toString());
  return parsedMessage;
};

// Helper functions for common responses
const jsonResponse = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });

const errorResponse = (message: string, status = 400) =>
  new Response(message, {
    status,
    headers: corsHeaders,
  });

const server = Bun.serve({
  port: 8080,
  async fetch(req, server) {
    const url = new URL(req.url);

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (url.pathname) {
        case "/":
          return new Response("Hello Hono!");

        case "/ws": {
          // const email = url.searchParams.get("email");
          // console.log(`Websocket join request from ${email}`);

          // if (!email) {
          //   return errorResponse("Email is required");
          // }

          // server.upgrade(req, { data: { email } });
          server.upgrade(req);
          return new Response("WebSocket connection upgraded");
        }

        default:
          return errorResponse("Not found", 404);
      }
    } catch (err) {
      return errorResponse("Internal server error", 500);
    }
  },

  websocket: {
    open(ws) {
      ws.subscribe(GLOBAL_TOPIC);
      const message: ServerMessage = {
        type: Action.Join,
        timestamp: Date.now(),
        serverTime: Date.now(),
      };
      ws.send(JSON.stringify(message));
    },

    message(ws, message) {
      const t1 = Date.now();
      const parsedMessage = deserializeMessage(message.toString());

      if (parsedMessage.type === Action.NTPRequest) {
        console.log("NTP request received");
        const ntpRequest = parsedMessage as NTPRequestMessage;
        const ntpResponse = {
          type: Action.NTPResponse,
          t0: ntpRequest.t0, // Echo back the client's t0
          t1, // Server receive time
          t2: Date.now(), // Server send time
        };

        ws.send(JSON.stringify(ntpResponse));
        return;
      }

      const clientMessage = parsedMessage as ClientMessage;
      const response = {
        type: clientMessage.type,
        timestamp: Date.now() + 500, // Schedule the action 500ms in the future
        serverTime: Date.now(),
      };

      console.log(`Message from client: ${JSON.stringify(clientMessage)}`);
      console.log(`Broadcasting message to all clients`);
      server.publish(GLOBAL_TOPIC, JSON.stringify(response));
    },

    close(ws) {
      console.log(`Connection closed`);
      ws.unsubscribe(GLOBAL_TOPIC);
    },
  },
});

console.log(`HTTP listening on http://${server.hostname}:${server.port}`);
