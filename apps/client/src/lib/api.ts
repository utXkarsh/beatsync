import { AudioSource, ExtractAudioSource } from "@beatsync/shared";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

const baseAxios = axios.create({
  baseURL: BASE_URL,
});

export const fetchYouTubeAudio = async (id: string) => {
  console.log(`Fetching audio with ID: ${id}`);

  try {
    const response = await fetch(`${BASE_URL}/audio?audioId=${id}`);

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries([...response.headers]));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log("Received array buffer length:", arrayBuffer.byteLength);

    // Convert to blob
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    console.log("Created blob size:", blob.size);

    return blob;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const extractYouTubeAudio = async (data: ExtractAudioSource) => {
  try {
    const response = await baseAxios.post<AudioSource>("/extract", data);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to extract YouTube audio"
      );
    }
    throw error;
  }
};
