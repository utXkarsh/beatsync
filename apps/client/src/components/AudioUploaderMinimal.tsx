"use client";

import { uploadAudioFile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRoomStore } from "@/store/room";
import { CloudUpload, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const AudioUploaderMinimal = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const roomId = useRoomStore((state) => state.roomId);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store file name for display
    setFileName(file.name);

    try {
      setIsUploading(true);

      // Read file as base64
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result?.toString().split(",")[1];
          if (!base64Data) throw new Error("Failed to convert file to base64");

          // Upload the file to the server
          await uploadAudioFile({
            name: file.name,
            audioData: base64Data,
            roomId,
          });

          toast.success(`Uploaded ${file.name}`);

          // Reset the input and file name after successful upload
          event.target.value = "";
          setTimeout(() => setFileName(null), 3000);
        } catch (err) {
          console.error("Error during upload:", err);
          toast.error("Failed to upload audio file");
          setFileName(null);
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
        setFileName(null);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to process file");
      setIsUploading(false);
      setFileName(null);
    }
  };

  return (
    <div
      className={cn(
        "border border-neutral-700/50 rounded-md mx-2 transition-all overflow-hidden",
        isHovered ? "bg-neutral-800/50" : "bg-neutral-800/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <label htmlFor="audio-upload" className="cursor-pointer block w-full">
        <div className="p-3 flex items-center gap-3">
          <div className="bg-primary-700 text-white p-1.5 rounded-md flex-shrink-0">
            {isUploading ? (
              <CloudUpload className="h-4 w-4 animate-pulse" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white">
              {isUploading
                ? "Uploading..."
                : fileName
                ? fileName
                : "Upload audio"}
            </div>
            {!isUploading && !fileName && (
              <div className="text-xs text-neutral-400 truncate">
                Add music to queue
              </div>
            )}
          </div>
        </div>
      </label>

      <input
        id="audio-upload"
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        disabled={isUploading}
        className="hidden"
      />
    </div>
  );
};
