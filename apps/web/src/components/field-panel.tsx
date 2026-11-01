"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useOperations } from "@/lib/use-operations";
import { API, request, time } from "@/lib/api";
import { locationLabel } from "@/lib/location";
import { Button } from "./ui/button";
import { Status } from "./operator-support";

const MonitoringMap = dynamic(() => import("./monitoring-map"), { ssr: false });
const nextStatus: Record<string, { status: string; title: string }> = {
  assigned: { status: "accepted", title: "Terima tugas" },
  accepted: { status: "responding", title: "Berangkat ke lokasi" },
  responding: { status: "on_site", title: "Saya sudah tiba" },
  on_site: { status: "completed", title: "Selesaikan tugas regu" },
};

export function FieldPanel() {
  const { data, error, connected, refetch } = useOperations();
  const client = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const locked = useRef(false);
  if (!data) return <main className="empty-state boot"><h1>Petugas Damkar</h1><p>{error ? "Layanan belum terhubung." : "Menyiapkan tugas regu…"}</p>{error && <Button onClick={() => refetch()}>Coba kembali</Button>}</main>;
  const unit = data.response_units.find(item => item.id === unitId) || data.response_units[0];
  const assignments = data.dispatches.filter(item => item.unit_id === unit?.id && item.status !== "completed");
  const assignment = assignments.find(item => item.id === selected) || assignments[0];
  const incident = data.incidents.find(item => item.id === assignment?.incident_id);
  const camera = data.cameras.find(item => item.id === incident?.camera_id);
  const next = assignment ? nextStatus[assignment.status] : undefined;
  async function update(id: string, status: string) {
    if (locked.current) return;
    if (status === "completed" && !window.confirm("Selesaikan tugas regu? Operator tetap perlu memeriksa hasil penanganan dan menyatakan kejadian teratasi.")) return;
    locked.current = true; setBusy(true); setFailure(null);
    try {
      await request(`/api/dispatches/${id}/update-status`, { status });
      await client.invalidateQueries({ queryKey: ["bootstrap"] });
      await client.invalidateQueries({ queryKey: ["report"] });
    } catch (cause) { setFailure(cause instanceof Error ? cause.message : "Koneksi belum tersedia."); }
    finally { locked.current = false; setBusy(false); }
  }
  return <main className="workspace-main field-page" aria-label="Tugas regu">
    {!connected && <p className="availability-note" role="status">Menghubungkan ulang ke layanan pemantauan.</p>}
    <div className="field-controls"><label className="compact-select"><span className="sr-only">Pilih regu</span><select value={unit?.id || ""} disabled={busy || !data.response_units.length} onChange={event => { setUnitId(event.target.value); setSelected(""); setFailure(null); }}>{!data.response_units.length && <option value="">Belum ada regu</option>}{data.response_units.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    {failure && <div className="error-banner" role="alert"><div><strong>Status belum tersimpan. Silakan coba lagi.</strong><details><summary>Lihat detail</summary><p>{failure}</p></details></div></div>}
    {assignments.length > 1 && <label className="field-label task-picker">Tugas aktif<select value={assignment?.id || ""} disabled={busy} onChange={event => setSelected(event.target.value)}>{assignments.map(item => <option key={item.id} value={item.id}>{data.cameras.find(camera => camera.id === data.incidents.find(incident => incident.id === item.incident_id)?.camera_id)?.name || item.incident_id}</option>)}</select></label>}
    {assignment && incident ? <article className="field-task">
      <div className="task-main"><Status value={assignment.status} /><h2>{incident.category === "fire" ? "Tangani indikasi api" : "Periksa indikasi asap"}</h2><p className="task-location">{camera?.name || incident.camera_id}</p><p className="muted">Ditugaskan pukul {time(assignment.created_at)} WIB</p>
        <ol className="task-progress" aria-label="Tahap tugas">{["Terima", "Berangkat", "Tiba", "Selesai"].map((title, index) => { const current = ["assigned", "accepted", "responding", "on_site"].indexOf(assignment.status); return <li key={title} className={index <= current ? "done" : ""} aria-current={index === current ? "step" : undefined}><span>{index < current ? <CheckCircle2 size={16} /> : index + 1}</span>{title}</li>; })}</ol>
        {incident.notes && <blockquote className="task-note"><span>Catatan operator</span>{incident.notes}</blockquote>}
        {next && <Button disabled={busy} onClick={() => update(assignment.id, next.status)}>{busy ? "Menyimpan…" : next.title}</Button>}
      </div>
      {incident.evidence_path && <img className="task-evidence" alt="Gambar indikasi dari kamera pemantauan" src={`${API}/api/evidence/${incident.evidence_path.replace(/^evidence\//, "")}`} />}
      <details className="disclosure task-details"><summary>Lokasi & detail tugas</summary><div className="map-area field-map"><MonitoringMap data={data} onLocation={() => {}} /></div><dl className="metadata"><dt>Lokasi perkiraan</dt><dd>{incident.latitude !== null && incident.longitude !== null ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}` : "Belum ditentukan"}</dd><dt>Sumber lokasi</dt><dd>{locationLabel(incident)}</dd>{incident.location_uncertainty_m !== null && <><dt>Radius asumsi simulasi</dt><dd>±{incident.location_uncertainty_m.toFixed(0)} m</dd></>}<dt>Sumber kejadian</dt><dd>{incident.provenance === "ai" ? "Deteksi AI" : "Simulasi manual"}</dd></dl></details>
    </article> : <div className="empty-state field-empty"><h2>{unit ? "Siaga. Belum ada tugas baru." : "Regu belum tersedia"}</h2><p>{unit ? "Tugas dari operator akan muncul di sini." : "Regu yang disiapkan akan tampil di halaman ini."}</p></div>}
  </main>;
}
