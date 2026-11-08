"use client";

import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { useOperations } from "@/lib/use-operations";
import { label, time } from "@/lib/api";
import { locationLabel } from "@/lib/location";
import { DroneHUD } from "./drone-hud";
import { DronePOV } from "./drone-pov";
import { Button } from "./ui/button";

const MonitoringMap = dynamic(() => import("./monitoring-map"), { ssr: false });
const terminal = ["completed", "cancelled", "aborted", "failed"];
const eventNames: Record<string, string> = {
  "mission.started": "Drone berangkat", "mission.arrived": "Tiba di area target",
  "incident.location_refined": "Perkiraan lokasi diperbarui", "mission.completed": "Drone kembali",
  "mission.automation_authorized": "Perjalanan otomatis diizinkan", "mission.approved": "Misi disetujui",
  "mission.created": "Misi dibuat", "mission.scan_completed": "Pemindaian selesai",
  "mission.payload_released": "Air dilepaskan", "mission.abort_requested": "Penghentian diminta", "mission.aborted": "Misi dihentikan",
};

export function DronePanel({ onIncident }: { onIncident: (id: string) => void }) {
  const { data, error, connected, refetch } = useOperations();
  if (!data) return <main className="empty-state boot"><h1>Pantauan drone</h1><p>{error ? "Layanan belum terhubung." : "Menyiapkan pantauan udara…"}</p>{error && <Button onClick={() => refetch()}>Coba kembali</Button>}</main>;
  const drone = data.drones[0];
  if (!drone) return <main className="empty-state boot"><h1>Drone belum tersedia</h1><p>Drone yang disiapkan akan muncul di sini.</p></main>;
  const mission = data.missions.find(item => item.id === drone.mission_id) || data.missions.filter(item => item.drone_id === drone.id).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  const incident = data.incidents.find(item => item.id === mission?.incident_id);
  const active = !!mission && !terminal.includes(mission.status);
  const flying = !!mission && ["en_route", "on_site", "suppression_simulation", "returning"].includes(mission.status);
  const events = mission ? data.activities.filter(event => event.data.mission_id === mission.id || (event.type === "incident.location_refined" && event.data.incident_id === mission.incident_id)).slice(0, 10) : [];
  const headline = data.demo.paused && active ? "Perjalanan dijeda" : mission ? label(mission.status) : "Siap membantu dari udara";
  return <main className="workspace-main drone-page" aria-label="Pantauan drone">
    {!connected && <p className="availability-note" role="status">Menghubungkan ulang ke layanan pemantauan.</p>}
    {incident && <button className="text-button back-link" onClick={() => onIncident(incident.id)}><ArrowLeft size={17} />Kembali ke penanganan</button>}
    <section className="drone-view">
      <div className="drone-video"><DronePOV drone={drone} mission={mission} paused={data.demo.paused} speed={data.demo.speed} /><DroneHUD drone={drone} mission={mission} paused={data.demo.paused} />{(!flying || data.demo.paused) && <div className="drone-idle"><h2>{headline}</h2><p>{data.demo.paused && active ? "Lanjutkan pemantauan dari operator." : active ? "Menunggu pengiriman dari operator." : mission ? "Hasil penanganan tetap diperiksa oleh operator." : "Belum ada misi yang berjalan."}</p></div>}</div>
      <div className="drone-caption"><span><i className={active ? "online-dot" : "offline-dot"} />{headline}</span><span>{mission?.automatic ? "Berjalan otomatis" : mission ? "Diarahkan operator" : "Siaga"}</span></div>
    </section>
    <div className="drone-details">
      <details className="disclosure"><summary>Detail penerbangan</summary><dl className="metadata"><dt>Tugas</dt><dd>{mission ? mission.mission_type === "reconnaissance" ? "Pindai area" : "Pindai & lepaskan air" : "Belum ada tugas"}</dd><dt>Baterai</dt><dd>{drone.battery_pct.toFixed(1)}%</dd><dt>Air</dt><dd>{drone.payload_l.toFixed(1)} L</dd><dt>Jarak tersisa</dt><dd>{flying && mission ? `${mission.distance_m.toFixed(0)} m` : "—"}</dd><dt>Perkiraan tiba</dt><dd>{flying && mission ? `${mission.eta_s.toFixed(0)} detik` : "—"}</dd><dt>Posisi</dt><dd>{drone.latitude.toFixed(5)}, {drone.longitude.toFixed(5)}</dd><dt>Ketinggian</dt><dd>{drone.altitude_m.toFixed(0)} m</dd><dt>Kecepatan pemutaran</dt><dd>{data.demo.speed}×</dd></dl></details>
      <details className="disclosure"><summary>Lihat posisi di peta</summary><div className="map-area drone-map"><MonitoringMap data={data} onLocation={() => {}} /></div>{incident && <p className="muted small">{locationLabel(incident)}{incident.location_uncertainty_m !== null ? ` · radius asumsi ±${incident.location_uncertainty_m.toFixed(0)} m` : ""}</p>}</details>
      <details className="disclosure"><summary>Aktivitas misi</summary><div className="drone-event-list">{events.length ? events.map(event => <div key={event.event_id}><time>{time(event.timestamp)}</time><span>{eventNames[event.type] || "Misi diperbarui"}</span></div>) : <p className="muted">Belum ada aktivitas misi.</p>}</div></details>
      <details className="disclosure"><summary>Kredit visual</summary><p className="muted small">Rekaman <a href="https://www.pexels.com/video/aerial-view-of-wildfire-with-heavy-smoke-29702252/" target="_blank" rel="noreferrer">hutan dan kebakaran</a> serta <a href="https://drive.google.com/file/d/1psk94hiEVNVbT9_iR79KDLcelJifW6fb/view" target="_blank" rel="noreferrer">pelepasan air</a> dari video yang disediakan untuk proyek. Rekaman hutan: 8K / Pexels.</p></details>
    </div>
  </main>;
}
