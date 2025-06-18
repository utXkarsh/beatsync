import type { CpuInfo } from "os";
import * as os from "os";
import { roomManager } from "../roomManager";
import { corsHeaders } from "../utils/responses";

export async function handleStats(): Promise<Response> {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = process.memoryUsage(); // rss, heapTotal, heapUsed, external, arrayBuffers

  const stats = {
    cpu: {
      count: cpus.length,
      cores: cpus.map((core: CpuInfo) => ({
        model: core.model,
        speed: core.speed,
      })),
    },
    memory: {
      total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      process: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
        arrayBuffers: `${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(
          2
        )} MB`,
      },
    },
  };

  // --- Add Room Manager Stats ---
  const roomDetails = Object.fromEntries(
    Array.from(roomManager.rooms.entries()).map(([roomId, roomData]) => [
      roomId,
      {
        clientCount: roomData.clients.size,
        // Add other room-specific details if needed
      },
    ])
  );

  // --- Combine stats ---
  const combinedStats = {
    ...stats, // Existing CPU and Memory stats
    rooms: {
      total: roomManager.rooms.size,
      details: roomDetails,
    },
  };

  return new Response(JSON.stringify(combinedStats), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
