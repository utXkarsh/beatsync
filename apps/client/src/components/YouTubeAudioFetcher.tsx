"use client";

import { extractYouTubeAudio } from "@/lib/api";
import { useRoomStore } from "@/store/room";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormValues = {
  url: string;
};

export const YouTubeAudioFetcher = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const roomId = useRoomStore((state) => state.roomId);
  const username = useRoomStore((state) => state.username);

  const onSubmit = async ({ url }: FormValues) => {
    try {
      const response = await extractYouTubeAudio({ url, roomId, username });
      console.log(response);
      // const audioSource = await extractYouTubeAudio(data.youtubeId, roomId);
      // console.log(audioSource);
      // setAudioSource({
      //   id: data.youtubeId,
      //   title: `YouTube: ${data.youtubeId}`,
      //   url: audioUrl,
      //   type: "youtube",
      // });
    } catch (error) {
      console.error("Failed to fetch YouTube audio:", error);
      toast.error("Failed to load audio");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="flex gap-2">
        <input
          {...register("url", { required: "YouTube URL is required" })}
          placeholder="Enter YouTube URL"
          className="flex-1 px-3 py-2 border rounded"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? "Loading..." : "Load"}
        </button>
      </div>
      {errors.url && (
        <p className="text-red-500 text-sm">{errors.url.message}</p>
      )}
    </form>
  );
};
