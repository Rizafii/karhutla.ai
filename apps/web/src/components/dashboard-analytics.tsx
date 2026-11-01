"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Thermometer, Wind, Droplets } from "lucide-react";
import { WeatherSummary } from "./weather-summary";
import type { Camera } from "@/lib/types";
import { fetchWeather, weatherLocation, weatherPotential } from "@/lib/weather";

export function DashboardAnalytics({ cameras }: { cameras: Camera[] }) {
  const [range, setRange] = useState(24);
  const location = weatherLocation(cameras);
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["weather", location?.latitude, location?.longitude],
    queryFn: ({ signal }) => fetchWeather(location!.latitude, location!.longitude, signal),
    enabled: !!location, staleTime: 900000, refetchInterval: 900000, retry: 1,
  });
  const format = (value: number | null | undefined, unit = "") => typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}${unit}` : "—";
  const points = data?.hourly.time.slice(0, range).map((time, index) => ({
    hour: new Intl.DateTimeFormat("id-ID", { timeZone: data.timezone, hour: "2-digit", minute: "2-digit" }).format(time * 1000),
    temperature: data.hourly.temperature_2m[index],
  })) || [];
  const temperatures = points.map(point => point.temperature).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return <div className="analytics-grid">
    <section className="dashboard-card temperature-card">
      <div className="card-heading"><div><h2>Temperatur area</h2><p>Prakiraan per jam · area kamera</p></div><div className="range-switch" aria-label="Rentang prakiraan">{[12, 24].map(hours => <button key={hours} aria-pressed={range === hours} onClick={() => setRange(hours)}>{hours} jam</button>)}</div></div>
      <div className="temperature-main"><div className="temperature-number"><span>Suhu saat ini</span><strong>{format(data?.current.temperature_2m, "°")}<small>C</small></strong><span className="metric-caption">{temperatures.length ? `${Math.round(Math.min(...temperatures))}° – ${Math.round(Math.max(...temperatures))}° dalam ${range} jam` : "Menunggu data cuaca"}</span></div>
      <div className="temperature-chart" role="img" aria-label={`Grafik prakiraan temperatur ${range} jam dalam derajat Celsius`}>
        {temperatures.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={points} margin={{ top: 12, right: 12, bottom: 0, left: -24 }}><defs><linearGradient id="temperature-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#356cff" stopOpacity={0.22} /><stop offset="100%" stopColor="#356cff" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8ecf2" /><XAxis dataKey="hour" axisLine={false} tickLine={false} minTickGap={32} tick={{ fontSize: 11, fill: "#8b94a4" }} /><YAxis domain={["dataMin - 2", "dataMax + 2"]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8b94a4" }} tickFormatter={value => `${Math.round(value)}°`} /><Tooltip formatter={value => [`${value} °C`, "Temperatur"]} contentStyle={{ borderRadius: 12, border: "1px solid #e8ecf2", fontSize: 12 }} /><Area type="monotone" dataKey="temperature" stroke="#356cff" strokeWidth={2.5} fill="url(#temperature-fill)" isAnimationActive={false} connectNulls={false} /></AreaChart></ResponsiveContainer> : <div className="chart-empty" role="status">{!location ? "Tambahkan lokasi kamera untuk melihat prakiraan." : isPending ? "Memuat temperatur area…" : "Prakiraan belum tersedia."}{isError && <button className="text-button" disabled={isFetching} onClick={() => refetch()}>Coba lagi</button>}</div>}
      </div></div>
      <div className="climate-metrics"><div><Thermometer size={16} /><span>Suhu tertinggi<strong>{temperatures.length ? format(Math.max(...temperatures), "°C") : "—"}</strong></span></div><div><Droplets size={16} /><span>Kelembapan<strong>{format(data?.current.relative_humidity_2m, "%")}</strong></span></div><div><Wind size={16} /><span>Kecepatan angin<strong>{format(data?.current.wind_speed_10m, " km/jam")}</strong></span></div></div>
      <div className="chart-foot"><span>{data ? `Waktu lokal · ${data.timezone.replace("Asia/", "")}` : "Prakiraan cuaca"}{isError && " · Pembaruan tertunda"}</span><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo ↗</a></div>
    </section>
    <WeatherSummary cameras={cameras} />
  </div>;
}

export function FirePotential({ cameras }: { cameras: Camera[] }) {
  const location = weatherLocation(cameras);
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["weather", location?.latitude, location?.longitude],
    queryFn: ({ signal }) => fetchWeather(location!.latitude, location!.longitude, signal),
    enabled: !!location, staleTime: 900000, refetchInterval: 900000, retry: 1,
  });
  const score = data && !isError && Date.now() / 1000 - data.current.time < 7200 ? weatherPotential(data.current) : null;
  const level = score === null ? "Data belum tersedia" : score < 35 ? "Rendah" : score < 65 ? "Sedang" : "Tinggi";
  const tone = score === null ? "unknown" : score < 35 ? "low" : score < 65 ? "medium" : "high";
  return <section className={`dashboard-card fire-potential ${tone}`}>
      <div className="card-heading"><div><h2>Potensi kebakaran</h2><p>Indeks kondisi cuaca</p></div><span className="risk-badge">{level}</span></div>
      <div className="risk-gauge"><svg viewBox="0 0 240 145" aria-hidden="true">{Array.from({ length: 41 }, (_, index) => { const angle = Math.PI + index / 40 * Math.PI; const active = score !== null && index / 40 * 100 <= score; return <line key={index} x1={120 + 88 * Math.cos(angle)} y1={116 + 88 * Math.sin(angle)} x2={120 + 107 * Math.cos(angle)} y2={116 + 107 * Math.sin(angle)} stroke={active ? "var(--risk-color)" : "#edf0f4"} strokeWidth="4" strokeLinecap="round" />; })}</svg><div><strong>{score ?? "—"}<small>/100</small></strong><span>{score === null ? "Menunggu cuaca terbaru" : `Potensi ${level.toLowerCase()}`}</span></div></div>
      <p className="risk-explainer">Estimasi eksperimental berbasis suhu, kelembapan, dan angin.</p>
      <details className="risk-method"><summary>Metode & probabilitas</summary><p>Probabilitas kebakaran belum tersedia: diperlukan model yang terkalibrasi. Indeks ini memakai bobot suhu 30%, kekeringan udara 50%, dan angin 20%; bukan persentase peluang atau indeks bahaya resmi.</p><p>Suhu dinormalisasi dari 20–40°C, kelembapan dari 80–20%, dan angin dari 0–40 km/jam; setiap faktor dibatasi 0–1. Belum mencakup kondisi bahan bakar, gambut, atau riwayat hujan.</p><a href="https://www.nwcg.gov/publications/pms425-1/11-weather-and-fuel-moisture" target="_blank" rel="noreferrer">Tentang cuaca dan bahan bakar ↗</a></details>
    </section>;
}
