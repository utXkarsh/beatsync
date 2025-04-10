"use client";

import { uploadAudioFile } from "@/lib/api";
import { useRoomStore } from "@/store/room";
import { useState } from "react";
import { toast } from "sonner";

export const AudioUploader = () => {
  const [isUploading, setIsUploading] = useState(false);
  const roomId = useRoomStore((state) => state.roomId);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an audio file
    // if (!file.type.startsWith("audio/")) {
    //   toast.error("Please select an audio file");
    //   return;
    // }

    try {
      setIsUploading(true);

      // Read file as base64
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result?.toString().split(",")[1];
          if (!base64Data) throw new Error("Failed to convert file to base64");

          // Upload the file to the server
          const result = await uploadAudioFile({
            name: file.name,
            audioData: base64Data,
            roomId,
          });

          console.log("Upload result:", result);

          toast.success(`Uploaded: ${file.name}`);

          // Reset the file input
          event.target.value = "";
        } catch (err) {
          console.error("Error during upload:", err);
          toast.error("Failed to upload audio file");
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to process file");
      setIsUploading(false);
    }
  };

  return (
    <div className="my-4 p-4 border border-gray-200 rounded-md">
      <h3 className="text-lg font-medium mb-2">Upload Audio</h3>
      <div className="flex flex-col items-start gap-2">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-100 file:text-gray-700
            hover:file:bg-gray-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isUploading && (
          <div className="text-sm text-gray-500">Uploading...</div>
        )}
      </div>
    </div>
  );
};
