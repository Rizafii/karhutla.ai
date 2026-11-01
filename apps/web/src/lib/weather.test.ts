import { afterEach, expect, it, vi } from "vitest";
import { fetchWeather, weatherLabel, weatherLocation, weatherPotential } from "./weather";

afterEach(() => vi.unstubAllGlobals());

it("does not produce risk readings from missing or invalid weather", () => {
  const current = { time: 1, temperature_2m: 30, relative_humidity_2m: 60, wind_speed_10m: 10, weather_code: 0 };
  expect(weatherPotential({ ...current, temperature_2m: null })).toBeNull();
  expect(weatherPotential({ ...current, relative_humidity_2m: 101 })).toBeNull();
  expect(weatherPotential({ ...current, wind_speed_10m: -1 })).toBeNull();
  expect(weatherPotential({ ...current, temperature_2m: NaN })).toBeNull();
  const humid = weatherPotential({ ...current, temperature_2m: 18, relative_humidity_2m: 90, wind_speed_10m: 0 });
  const dry = weatherPotential({ ...current, temperature_2m: 45, relative_humidity_2m: 10, wind_speed_10m: 70 });
  expect(humid).toBe(0);
  expect(dry).toBe(100);
  expect(weatherPotential(current)).toBeGreaterThan(humid!);
  expect(weatherPotential(current)).toBeLessThan(dry!);
});

it("uses camera coordinates and ignores invalid locations without inventing a fallback", () => {
  expect(weatherLocation([])).toBeNull();
  expect(weatherLocation([{ latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }])).toBeNull();
  expect(weatherLocation([
    { latitude: -2.3, longitude: 113.889 },
    { latitude: -2.3, longitude: 113.911 },
    { latitude: 0, longitude: Infinity },
  ])).toEqual({ latitude: -2.3, longitude: 113.9 });
});

it("distinguishes clear weather, rain, thunderstorms and missing conditions", () => {
  expect(weatherLabel(0)).toBe("Cerah");
  expect(weatherLabel(63)).toBe("Hujan");
  expect(weatherLabel(95)).toBe("Hujan petir");
  expect(weatherLabel(null)).toBe("Belum tersedia");
  expect(weatherLabel(999)).toBe("Belum tersedia");
});

it("surfaces provider failures so the UI can offer a retry", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
  await expect(fetchWeather(-2.3, 113.9)).rejects.toThrow("Cuaca belum tersedia");
});

it("rejects incomplete upstream data instead of showing fabricated readings", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ current: { time: 1 } })));
  await expect(fetchWeather(-2.3, 113.9)).rejects.toThrow("Data cuaca belum lengkap");
});

it("preserves missing values and requests explicit units and location time zone", async () => {
  const data = {
    timezone: "Asia/Pontianak",
    current: { time: 1793528100, temperature_2m: null, weather_code: null, relative_humidity_2m: null, wind_speed_10m: null },
    hourly: { time: [], temperature_2m: [], weather_code: [], precipitation_probability: [] },
  };
  const fetcher = vi.fn().mockResolvedValue(Response.json(data));
  vi.stubGlobal("fetch", fetcher);
  expect(await fetchWeather(-2.3, 113.9)).toEqual(data);
  const url = new URL(fetcher.mock.calls[0][0]);
  expect(url.searchParams.get("latitude")).toBe("-2.3");
  expect(url.searchParams.get("timezone")).toBe("auto");
  expect(url.searchParams.get("wind_speed_unit")).toBe("kmh");
  expect(url.searchParams.get("timeformat")).toBe("unixtime");
});
