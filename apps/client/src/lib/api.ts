import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

const baseAxios = axios.create({
  baseURL: BASE_URL,
});

export const fetchYouTubeAudio = async (audioId: string) => {
  const response = await baseAxios.get<Blob>(`/audio`, {
    params: { audioId },
    responseType: "blob",
  });
  return response.data;
};
