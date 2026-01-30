import type { AqicnResponse, AqiData } from './types';
export type { AqiData } from './types';

const AQICN_API_BASE = 'https://api.waqi.info/feed';

export async function fetchAqi(city: string, token: string): Promise<AqiData> {
  const url = `${AQICN_API_BASE}/${encodeURIComponent(city)}/?token=${token}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch AQI data: ${response.status} ${response.statusText}`);
  }

  const result: AqicnResponse = await response.json();

  if (result.status !== 'ok') {
    throw new Error(`AQICN API error: ${JSON.stringify(result)}`);
  }

  const data = result.data;

  return {
    city: data.city.name,
    aqi: data.aqi,
    pm25: data.iaqi.pm25?.v ?? null,
    pm10: data.iaqi.pm10?.v ?? null,
    o3: data.iaqi.o3?.v ?? null,
    no2: data.iaqi.no2?.v ?? null,
    co: data.iaqi.co?.v ?? null,
    so2: data.iaqi.so2?.v ?? null,
    time: data.time.s,
    timestamp: data.time.v * 1000,
  };
}
