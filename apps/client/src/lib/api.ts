import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

const baseAxios = axios.create({
  baseURL: BASE_URL,
});

export const uploadAudioFile = async (data: { file: File; roomId: string }) => {
  try {
    // Create FormData for binary upload
    const formData = new FormData();
    formData.append("audio", data.file);
    formData.append("roomId", data.roomId);

    const response = await baseAxios.post<{
      success: boolean;
      filename: string;
      path: string;
      size: number;
    }>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

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

export const fetchAudio = async (id: string) => {
  try {
    const response = await fetch(`${BASE_URL}/audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      console.error(`RESPONSE NOT OK`);
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Failed to fetch audio");
    }
    throw error;
  }
};
