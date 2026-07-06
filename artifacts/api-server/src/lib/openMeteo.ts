import { logger } from "./logger";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface GeocodeResult {
  results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string }>;
}

/**
 * Geocodes a market/district + state name to GPS coordinates using
 * Open-Meteo's free geocoding API (no key required). Falls back from a
 * specific market name to just the district/state if no match is found.
 */
export async function geocodeIndianLocation(
  primary: string,
  fallback: string,
): Promise<GeoPoint | null> {
  for (const query of [primary, fallback]) {
    try {
      const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json&countryCode=IN`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as GeocodeResult;
      const match = data.results?.[0];
      if (match) {
        return { latitude: match.latitude, longitude: match.longitude };
      }
    } catch (err) {
      logger.warn({ err, query }, "geocoding lookup failed");
    }
  }
  return null;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationMm: number;
}

/** Fetches a real 7-day weather forecast from Open-Meteo (free, no API key). */
export async function fetchForecast(point: GeoPoint, days: number): Promise<DailyForecast[]> {
  const url =
    `${FORECAST_URL}?latitude=${point.latitude}&longitude=${point.longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=${Math.min(days, 16)}&timezone=Asia%2FKolkata`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo forecast request failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
    };
  };

  return data.daily.time.map((date, i) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipitationMm: data.daily.precipitation_sum[i],
  }));
}
