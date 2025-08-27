# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Beatsync is a high-precision web audio player built for multi-device synchronized playback. It's a monorepo using Turborepo.

- **Frontend**: Next.js 15 React app in `apps/client` with TypeScript, Tailwind CSS, and Shadcn/ui.
- **Backend**: Bun HTTP + WebSocket server in `apps/server` using the Hono framework.
- **Shared Package**: Type-safe schemas in `packages/shared` using Zod, shared between the client and server.

## Common Development Commands

- `bun install`: Install dependencies for all workspaces.
- `bun dev`: Start both the client (:3000) and server (:8080) in development mode.
- `bun client`: Start only the client.
- `bun server`: Start only the server.
- `bun build`: Build all applications.
- `cd apps/client && bun lint`: Lint the client-side code.

## Architecture

### Time Synchronization

The core feature is millisecond-accurate time synchronization across devices, inspired by NTP. The client-side logic for this is in `apps/client/src/lib/sync.ts`, and it's coordinated by the WebSocket server.

### State Management

The client uses Zustand for state management, with stores located in `apps/client/src/stores/`.

- `usePlayerStore`: Manages audio playback state.
- `useServerStore`: Manages the server connection and room state.
- `useUserStore`: Manages user preferences and device information.

### API and Data Flow

- **HTTP API**: The client uses an Axios client with React Query for data fetching.
- **WebSocket**: Real-time communication for synchronization is handled via WebSockets.
- **Type Safety**: Zod schemas in `packages/shared` ensure type safety between the client and server.

### Audio Storage

Audio is stored in Cloudflare R2. The client gets a presigned URL from the server and uploads the file directly to R2. The server then confirms the upload. This architecture minimizes server bandwidth costs and uses a global CDN for low-latency audio access.

Key files for this process include:

- `apps/server/src/lib/r2.ts`: R2 utility functions.
- `apps/server/src/routes/upload.ts`: Handles the presigned URL flow.
- `apps/client/src/lib/api.ts`: Implements the three-step upload process on the client.

## Environment Setup

You'll need to create `.env` files in `apps/client` and `apps/server`.

**`apps/client/.env`**:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

**`apps/server/.env`**:

```
# Cloudflare R2 Configuration (required for audio uploads)
S3_BUCKET_NAME=
S3_PUBLIC_URL=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

