// AQICN API response types
export interface AqicnResponse {
  status: 'ok' | 'error';
  data: AqicnData;
}

export interface AqicnData {
  aqi: number;
  idx: number;
  attributions: Attribution[];
  city: CityInfo;
  dominentpol: string;
  iaqi: {
    pm25?: { v: number };
    pm10?: { v: number };
    o3?: { v: number };
    no2?: { v: number };
    co?: { v: number };
    so2?: { v: number };
    t?: { v: number };
    h?: { v: number };
  };
  time: {
    s: string;  // Local time string
    tz: string; // Timezone
    v: number;  // Unix timestamp
    iso: string; // ISO format
  };
  forecast?: {
    daily: {
      pm25?: ForecastDay[];
      pm10?: ForecastDay[];
      o3?: ForecastDay[];
    };
  };
}

export interface Attribution {
  url: string;
  name: string;
}

export interface CityInfo {
  geo: [number, number];
  name: string;
  url: string;
  location: string;
}

export interface ForecastDay {
  avg: number;
  day: string;
  max: number;
  min: number;
}

// Simplified AQI data for internal use
export interface AqiData {
  city: string;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  co: number | null;
  so2: number | null;
  time: string;
  timestamp: number;
}
