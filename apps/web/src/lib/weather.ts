export type Weather = {
  timezone: string;
  current: { time: number; temperature_2m: number | null; relative_humidity_2m: number | null; wind_speed_10m: number | null; weather_code: number | null };
  hourly: { time: number[]; temperature_2m: (number | null)[]; precipitation_probability: (number | null)[]; weather_code: (number | null)[] };
};

export function weatherLabel(code: number | null) {
  if (code === null) return "Belum tersedia";
  if (code === 0) return "Cerah";
  if (code === 1 || code === 2) return "Cerah berawan";
  if (code === 3) return "Berawan";
  if (code === 45 || code === 48) return "Berkabut";
  if ([51, 53, 55, 56, 57].includes(code)) return "Gerimis";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Hujan";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Salju";
  if ([95, 96, 97, 99].includes(code)) return "Hujan petir";
  return "Belum tersedia";
}

export function weatherLocation(cameras: { latitude: number; longitude: number }[]) {
  const valid = cameras.filter(camera => Number.isFinite(camera.latitude) && Math.abs(camera.latitude) <= 90 && Number.isFinite(camera.longitude) && Math.abs(camera.longitude) <= 180);
  if (!valid.length) return null;
  return {
    latitude: Number((valid.reduce((sum, camera) => sum + camera.latitude, 0) / valid.length).toFixed(3)),
    longitude: Number((valid.reduce((sum, camera) => sum + camera.longitude, 0) / valid.length).toFixed(3)),
  };
}

export async function fetchWeather(latitude: number, longitude: number, signal?: AbortSignal): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    forecast_hours: "24", timeformat: "unixtime", timezone: "auto", wind_speed_unit: "kmh", temperature_unit: "celsius",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Cuaca belum tersedia.");
  const data: Weather = await response.json();
  if (!data.current || !Number.isFinite(data.current.time) || !data.hourly || !Array.isArray(data.hourly.time) || !Array.isArray(data.hourly.temperature_2m) || !Array.isArray(data.hourly.precipitation_probability) || !Array.isArray(data.hourly.weather_code)) throw new Error("Data cuaca belum lengkap.");
  // Validate the time zone before using it in date formatting.
  new Intl.DateTimeFormat("id-ID", { timeZone: data.timezone }).format();
  return data;
}

// Product heuristic, not a calibrated probability or an official fire danger index.
export function weatherPotential(current: Weather["current"]) {
  const { temperature_2m: temperature, relative_humidity_2m: humidity, wind_speed_10m: wind } = current;
  if ([temperature, humidity, wind].some(value => typeof value !== "number" || !Number.isFinite(value))) return null;
  if (humidity! < 0 || humidity! > 100 || wind! < 0) return null;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  return Math.round(100 * (0.3 * clamp((temperature! - 20) / 20) + 0.5 * clamp((80 - humidity!) / 60) + 0.2 * clamp(wind! / 40)));
}
