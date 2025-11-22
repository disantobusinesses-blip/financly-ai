export interface GeoResponse {
  country: string;
  source: string;
}

export const fetchGeoCountry = async (): Promise<GeoResponse> => {
  const response = await fetch("/api/geo");
  if (!response.ok) {
    throw new Error("Unable to detect country");
  }
  return response.json();
};
