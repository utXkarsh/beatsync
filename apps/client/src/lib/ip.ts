import { IpWhoResponse, IpWhoResponseSchema } from "@beatsync/shared";

export const geolocateIP = async (): Promise<IpWhoResponse> => {
  const response = await fetch("https://ipwho.is/");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch geolocation: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log("Geolocation data:", data);

  // Check if it's an error response
  if (data.success === false) {
    throw new Error(`IP Geolocation Error: ${data.message || "Unknown error"}`);
  }

  // Validate and return the successful response
  return IpWhoResponseSchema.parse(data);
};
