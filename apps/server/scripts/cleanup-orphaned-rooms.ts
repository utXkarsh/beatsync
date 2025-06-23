#!/usr/bin/env bun
/**
 * Manual cleanup script for orphaned R2 room files
 * Run this to clean up rooms that exist in R2 but not in the server
 */

import { config } from "dotenv";
import { listObjectsWithPrefix, deleteObjectsWithPrefix } from "../src/lib/r2";
import { roomManager } from "../src/roomManager";

config();

async function cleanupOrphanedRooms(dryRun: boolean = true) {
  console.log("🧹 Starting R2 Orphaned Room Cleanup");
  console.log(`Mode: ${dryRun ? "DRY RUN (no deletions)" : "LIVE (will delete files)"}\n`);

  try {
    // Step 1: Get all objects in R2
    console.log("📋 Listing all objects in R2...");
    const allObjects = await listObjectsWithPrefix("");
    
    if (!allObjects || allObjects.length === 0) {
      console.log("✅ No objects found in R2. Nothing to clean up!");
      return;
    }

    console.log(`Found ${allObjects.length} total objects in R2\n`);

    // Step 2: Group objects by room
    const roomsInR2 = new Map<string, string[]>();
    
    allObjects.forEach(obj => {
      if (obj.Key) {
        const match = obj.Key.match(/^room-([^\/]+)\//);
        if (match) {
          const roomId = match[1];
          if (!roomsInR2.has(roomId)) {
            roomsInR2.set(roomId, []);
          }
          roomsInR2.get(roomId)!.push(obj.Key);
        }
      }
    });

    console.log(`📁 Found ${roomsInR2.size} unique rooms in R2`);

    // Step 3: Get active rooms from server (if running)
    const activeRooms = new Set<string>();
    
    // Note: This only works if the script is run while the server is running
    // Otherwise, all rooms will be considered orphaned
    try {
      // Get rooms from the running server instance
      roomManager.rooms.forEach((_, roomId) => {
        activeRooms.add(roomId);
      });
      console.log(`🏃 Found ${activeRooms.size} active rooms in server memory\n`);
    } catch (error) {
      console.log("⚠️  Could not access server room data (server not running?)\n");
    }

    // Step 4: Identify orphaned rooms
    const orphanedRooms: string[] = [];
    
    roomsInR2.forEach((files, roomId) => {
      if (!activeRooms.has(roomId)) {
        orphanedRooms.push(roomId);
      }
    });

    if (orphanedRooms.length === 0) {
      console.log("✅ No orphaned rooms found. R2 is in sync with server!");
      return;
    }

    console.log(`🗑️  Found ${orphanedRooms.length} orphaned rooms to clean up:`);
    
    // Show first 10 orphaned rooms
    orphanedRooms.slice(0, 10).forEach(roomId => {
      const fileCount = roomsInR2.get(roomId)?.length || 0;
      console.log(`   - room-${roomId} (${fileCount} files)`);
    });
    
    if (orphanedRooms.length > 10) {
      console.log(`   ... and ${orphanedRooms.length - 10} more rooms`);
    }

    // Calculate total files to be deleted
    let totalFilesToDelete = 0;
    orphanedRooms.forEach(roomId => {
      totalFilesToDelete += roomsInR2.get(roomId)?.length || 0;
    });
    
    console.log(`\n📊 Total files to delete: ${totalFilesToDelete}`);

    // Step 5: Delete orphaned rooms (if not dry run)
    if (!dryRun) {
      console.log("\n🚀 Starting deletion process...");
      
      let successCount = 0;
      let totalDeleted = 0;
      
      for (const roomId of orphanedRooms) {
        try {
          const result = await deleteObjectsWithPrefix(`room-${roomId}`);
          console.log(`✅ Deleted room-${roomId}: ${result.deletedCount} files`);
          successCount++;
          totalDeleted += result.deletedCount;
        } catch (error) {
          console.error(`❌ Failed to delete room-${roomId}:`, error);
        }
      }
      
      console.log(`\n✨ Cleanup complete!`);
      console.log(`   - Rooms cleaned: ${successCount}/${orphanedRooms.length}`);
      console.log(`   - Files deleted: ${totalDeleted}`);
    } else {
      console.log("\n⚠️  DRY RUN MODE - No files were deleted");
      console.log("Run with --live flag to actually delete files");
    }

  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes("--live");

// Run the cleanup
cleanupOrphanedRooms(!isLive).then(() => {
  console.log("\n👋 Done!");
  process.exit(0);
});