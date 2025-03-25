import { UploadAudio } from "@beatsync/shared";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

const baseAxios = axios.create({
  baseURL: BASE_URL,
});

export const uploadAudioFile = async (data: UploadAudio) => {
  try {
    const response = await baseAxios.post<{
      success: boolean;
      filename: string;
      path: string;
      size: number;
    }>("/upload", data);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to upload audio file"
      );
    }
    throw error;
  }
};
