"use client";


import type { Bootstrap, Incident } from "@/lib/types";
import { time } from "@/lib/api";
import { CCTVWall } from "./cctv-wall";
import { Status } from "./operator-support";
import { DashboardAnalytics, FirePotential } from "./dashboard-analytics";
import { Video, ScanLine, Shield, Plane } from "lucide-react";

export function IncidentList({ incidents, data, onSelect, reports = false }: {
  incidents: Incident[]; data: Bootstrap; onSelect: (id: string) => void; reports?: boolean;
}) {
  return <div className={reports ? "history-list" : "alert-list"}>{incidents.map(incident => <button key={incident.id} className="incident-entry" onClick={() => onSelect(incident.id)}>
    <span className={`event-dot ${incident.status === "pending_review" ? "attention" : ""}`} />
    <span className="entry-copy"><strong>{incident.category === "smoke" ? "Indikasi asap" : "Indikasi api"}</strong><span>{data.cameras.find(camera => camera.id === incident.camera_id)?.name || incident.camera_id}</span><small>{reports && `${new Date(incident.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" })} · `}{time(incident.created_at)} WIB · {incident.provenance === "manual_simulation" ? "Simulasi manual" : "Deteksi AI"}</small></span>
    <span className="entry-action"><Status value={incident.status} /></span>
  </button>)}</div>;
}

export function WorkspaceOverview({ data, onIncident, onMap }: {
  data: Bootstrap; onIncident: (id: string) => void; onMap: () => void;
}) {
  const active = data.incidents.filter(item => !["closed", "resolved", "false_alarm"].includes(item.status));
  const pending = active.filter(item => item.status === "pending_review");
  const ordered = [...active].sort((a, b) => Number(b.status === "pending_review") - Number(a.status === "pending_review") || Date.parse(b.created_at) - Date.parse(a.created_at));
  const readyUnits = data.response_units.filter(unit => unit.availability === "available").length;
  const availableDrones = data.drones.filter(drone => drone.status === "available").length;
  const metrics = [
    { title: "Kamera terhubung", value: data.cameras.filter(camera => camera.connection_status === "connected").length, total: data.cameras.length, detail: "Sumber pantauan area", icon: Video, tone: "blue" },
    { title: "Perlu diverifikasi", value: pending.length, detail: `${active.length} kejadian aktif`, icon: ScanLine, tone: "orange" },
    { title: "Regu tersedia", value: readyUnits, total: data.response_units.length, detail: "Kesiapan tim lapangan", icon: Shield, tone: "green" },
    { title: "Drone siaga", value: availableDrones, total: data.drones.length, detail: "Dukungan pemantauan udara", icon: Plane, tone: "purple" },
  ];
  return <div className="dashboard-overview">
    <div className="metric-grid">{metrics.map(metric => <section className={`metric-card ${metric.tone}`} key={metric.title}><div><span>{metric.title}</span><metric.icon size={17} /></div><strong>{metric.value}<small>{metric.total !== undefined ? ` / ${metric.total}` : ""}</small></strong><p><i />{metric.detail}</p></section>)}</div>
    <div className="watch-layout">
    <div className="watch-camera"><CCTVWall data={data} onMap={onMap} onIncident={onIncident} /></div>
    <div className="watch-summary" aria-label="Ringkasan pantauan">
    <aside className="watch-inbox"><div className="inbox-heading"><h2>{pending.length ? "Perlu diperiksa" : "Kejadian"}</h2><span>{active.length}</span></div>{active.length ? <IncidentList incidents={ordered} data={data} onSelect={onIncident} /> : <div className="empty-state inbox-empty"><h3>Belum ada peringatan</h3><p>Indikasi asap atau api akan muncul di sini.</p></div>}<p className="inbox-note">Pilih kejadian untuk memeriksa bukti dan menentukan respons.</p></aside>
    <FirePotential cameras={data.cameras} />
    </div>
  </div>
    <DashboardAnalytics cameras={data.cameras} />
  </div>;
}
