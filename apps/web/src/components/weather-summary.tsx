"use client";

import { useQuery } from "@tanstack/react-query";
import { WeatherArtwork } from "./weather-artwork";
import type { Camera } from "@/lib/types";
import { fetchWeather, weatherLabel, weatherLocation } from "@/lib/weather";

const value = (number: number | null | undefined, unit: string) => typeof number === "number" && Number.isFinite(number) ? `${Math.round(number)}${unit}` : "—";

export function WeatherSummary({ cameras }: { cameras: Camera[] }) {
  const location = weatherLocation(cameras);
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: ["weather", location?.latitude, location?.longitude],
    queryFn: ({ signal }) => fetchWeather(location!.latitude, location!.longitude, signal),
    enabled: !!location, staleTime: 15 * 60 * 1000, refetchInterval: 15 * 60 * 1000, retry: 1,
  });
  const clock = (time: number) => new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: data?.timezone, timeZoneName: "short" }).format(new Date(time * 1000));
  const hours = data?.hourly.time.map((time, index) => ({ time, index })).filter(hour => hour.time > Date.now() / 1000).slice(0, 3) || [];
  return <section className="weather-summary" aria-label="Prakiraan cuaca area pantauan">
    <div className="weather-heading"><h2>Prakiraan cuaca</h2><span>Area pantauan</span></div>
    {!location ? <p className="weather-message">Lokasi kamera belum tersedia.</p> : !data ? <p className="weather-message" role="status">{isPending ? "Memuat prakiraan cuaca…" : "Cuaca belum tersedia."}{isError && <button className="text-button" disabled={isFetching} onClick={() => refetch()}>Coba lagi</button>}</p> : <>
      <div className="weather-current"><WeatherArtwork code={data.current.weather_code} night={Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: data.timezone }).format(data.current.time * 1000)) >= 18 || Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: data.timezone }).format(data.current.time * 1000)) < 6} /><strong>{value(data.current.temperature_2m, "°C")}</strong><span>{weatherLabel(data.current.weather_code)}<small>{clock(data.current.time)}</small></span></div>
      <dl className="weather-metrics"><div><dt>Kelembapan</dt><dd>{value(data.current.relative_humidity_2m, "%")}</dd></div><div><dt>Angin</dt><dd>{value(data.current.wind_speed_10m, " km/jam")}</dd></div></dl>
      {hours.length > 0 && <div className="weather-hours">{hours.map(({ time, index }) => <div key={time}><time dateTime={new Date(time * 1000).toISOString()}>{clock(time)}</time><WeatherArtwork code={data.hourly.weather_code[index] ?? null} small /><strong>{value(data.hourly.temperature_2m[index], "°C")}</strong><span>{weatherLabel(data.hourly.weather_code[index] ?? null)}</span><small>Peluang hujan {value(data.hourly.precipitation_probability[index], "%")}</small></div>)}</div>}
      {isError && <p className="weather-message" role="status">Pembaruan cuaca tertunda. Menampilkan data terakhir.</p>}
    </>}
    <a className="weather-source" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
  </section>;
}
