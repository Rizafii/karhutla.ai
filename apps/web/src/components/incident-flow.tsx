"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Plane, Shield, TriangleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EvidenceImage } from "./evidence-image";
import { request, label, time } from "@/lib/api";
import type { Bootstrap, Incident, Mission } from "@/lib/types";
import { useWorkspace } from "@/lib/store";
import { Button } from "./ui/button";
import { Modal, Provenance, Status, type Actions } from "./operator-support";

const terminal = ["completed", "cancelled", "aborted", "failed"];
const finished = ["resolved", "false_alarm", "closed"];

export function IncidentFlow({ incident: initialIncident, data, busy, safely, run, failure, ask, onBack, onDrone }: {
  incident: Incident; data: Bootstrap; onBack: () => void; onDrone: () => void;
  run: Actions["safely"]; failure: string | null;
} & Actions) {
  const { data: detail } = useQuery({
    queryKey: ["incident", initialIncident.id],
    queryFn: ({ signal }) => request<Incident>(`/api/incidents/${initialIncident.id}`, undefined, "GET", signal),
    enabled: initialIncident.provenance === "ai" && !initialIncident.evidence_path,
    refetchInterval: query => query.state.data?.evidence_path ? false : 2000,
  });
  const incident = { ...initialIncident, evidence_path: initialIncident.evidence_path || detail?.evidence_path || null };
  const [teamMode, setTeamMode] = useState(false);
  const [extra, setExtra] = useState<"drone" | "team" | null>(null);
  const workspace = useWorkspace();
  const camera = data.cameras.find(item => item.id === incident.camera_id);
  const missions = data.missions.filter(item => item.incident_id === incident.id).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const activeMission = missions.find(item => !terminal.includes(item.status));
  const mission = activeMission || missions.at(-1);
  const assignments = data.dispatches.filter(item => item.incident_id === incident.id);
  const stage = finished.includes(incident.status) ? 3 : incident.status === "pending_review" ? 0 : mission || assignments.length || ["dispatched", "in_progress"].includes(incident.status) ? 2 : 1;
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [stage]);
  const falseAlarm = incident.status === "false_alarm" || (incident.status === "closed" && !incident.resolved_at);

  return <section className="flow-page" aria-label="Penanganan kejadian">
    <button className="text-button back-link" onClick={onBack}><ArrowLeft size={17} /> Kembali ke pantauan</button>
    <ol className="flow-steps" aria-label="Tahap kejadian">
      {["Periksa", "Bantuan", "Penanganan", "Selesai"].map((name, index) => {
        const skipped = falseAlarm && (index === 1 || index === 2);
        return <li key={name} className={index === stage ? "current" : index < stage && !skipped ? "done" : ""} aria-current={index === stage ? "step" : undefined} aria-label={skipped ? `${name}, dilewati` : undefined}><span>{skipped ? "-" : index < stage ? <Check size={13} /> : index + 1}</span>{name}</li>;
      })}
    </ol>
    <div className="inline-meta incident-context"><span>{camera?.name || incident.camera_id}</span><span>{time(incident.created_at)} WIB</span><Provenance incident={incident} /></div>

    {stage === 0 && <div className="review-layout">
      <div className="review-evidence">{incident.evidence_path ? <EvidenceImage key={incident.evidence_path} path={incident.evidence_path} alt={`Bukti indikasi ${incident.category === "smoke" ? "asap" : "api"}`} /> : <div className="empty-state"><TriangleAlert size={32} /><h2>{incident.provenance === "manual_simulation" ? "Kejadian simulasi manual" : "Gambar belum tersedia"}</h2><p>{incident.provenance === "manual_simulation" ? "Tidak ada gambar deteksi AI untuk kejadian ini." : "Menunggu gambar bukti. Data akan diperbarui otomatis."}</p></div>}</div>
      <div className="review-decision"><span className="eyebrow">{incident.category === "smoke" ? "INDIKASI ASAP" : "INDIKASI API"}</span><h2>Perlu ditangani?</h2><p>Pastikan indikasi pada gambar perlu ditindaklanjuti. Bantuan dipilih pada langkah berikutnya.</p><Button disabled={busy} onClick={() => safely(`/api/incidents/${incident.id}/confirm`, { notes: incident.notes })}>Lanjutkan penanganan </Button><Button variant="ghost" disabled={busy} onClick={() => ask("Tandai bukan kebakaran?", "Hasil pemeriksaan ini akan tersimpan di riwayat.", `/api/incidents/${incident.id}/reject`, { notes: incident.notes })}>Bukan kebakaran</Button></div>
    </div>}

    {stage === 1 && <section className="flow-card choice-card">
      {teamMode ? <><button className="text-button" onClick={() => setTeamMode(false)}><ArrowLeft size={15} /> Pilihan drone</button><TeamChoice incident={incident} data={data} busy={busy} safely={safely} /></> : <><DroneChoice incident={incident} data={data} busy={busy} safely={safely} /><button className="text-button choice-alternative" onClick={() => setTeamMode(true)}><Shield size={17} /> Tangani dengan regu </button></>}
    </section>}

    {stage === 2 && <section className="flow-card handling-card">
      <div className="handling-row"><span className="role-icon"><Plane size={23} /></span><div><h2>Drone</h2><p>{mission ? label(mission.status) : "Belum dikirim"}</p></div>{mission ? <button className="text-button" onClick={onDrone}>Lihat pantauan </button> : <Button variant="outline" disabled={busy} onClick={() => setExtra("drone")}>Kirim drone</Button>}</div>
      {mission && <MissionSummary mission={mission} payload={data.drones.find(item => item.id === mission.drone_id)?.payload_l || 0} busy={busy} safely={safely} ask={ask} />}
      <div className="handling-row"><span className="role-icon green"><Shield size={23} /></span><div><h2>Regu pemadam</h2><p>{assignments.length ? `${assignments.length} regu ditugaskan` : "Belum ditugaskan"}</p></div>{!assignments.length && <Button variant="outline" disabled={busy} onClick={() => setExtra("team")}>Tugaskan regu</Button>}</div>
      <TeamProgress incident={incident} data={data} busy={busy} safely={safely} ask={ask} />
      <div className="flow-actions"><p>Tim dan drone virtual. Hasil penanganan tetap perlu diperiksa.</p>{incident.status === "in_progress" ? <Button disabled={busy} onClick={() => ask("Kebakaran sudah teratasi?", "Pastikan hasil penanganan sudah diperiksa. Pelepasan air virtual atau kembalinya drone tidak membuktikan api padam.", `/api/incidents/${incident.id}/resolve`, { notes: incident.notes })}> Tandai teratasi</Button> : <p className="muted">Lanjutkan tugas regu atau misi drone untuk memulai penanganan.</p>}</div>
      <details className="disclosure"><summary>Tindakan lainnya</summary><div className="button-row">{!activeMission && <Button variant="outline" size="sm" disabled={busy} onClick={() => setExtra("drone")}>Kirim drone lagi</Button>}{assignments.length > 0 && <Button variant="outline" size="sm" disabled={busy} onClick={() => setExtra("team")}>Tambah regu</Button>}</div></details>
    </section>}

    {stage === 3 && <section className="flow-card completion"><h2>{falseAlarm ? "Bukan kebakaran" : "Kejadian sudah teratasi"}</h2><p>{incident.status === "closed" ? "Kejadian dan seluruh tindakannya tersimpan di riwayat." : "Tutup kejadian untuk menyelesaikan pencatatan."}</p>{incident.status !== "closed" ? <Button disabled={busy} onClick={() => safely(`/api/incidents/${incident.id}/close`, { notes: incident.notes })}>Tutup kejadian <Check size={17} /></Button> : <Button onClick={() => workspace.setReport(incident.id)}> Lihat laporan</Button>}{incident.status !== "closed" && <button className="text-button" onClick={() => workspace.setReport(incident.id)}>Lihat laporan sementara</button>}</section>}

    {stage === 3 && (activeMission || assignments.some(item => item.status !== "completed")) && <details className="incident-details"><summary>Respons yang masih berjalan</summary>{activeMission && <><div className="handling-row"><h2>Drone</h2><Status value={activeMission.status} /><button className="text-button" onClick={onDrone}>Lihat pantauan </button></div><MissionSummary mission={activeMission} allowLaunch={false} payload={data.drones.find(item => item.id === activeMission.drone_id)?.payload_l || 0} busy={busy} safely={safely} ask={ask} /></>}<TeamProgress incident={incident} data={data} busy={busy} safely={safely} ask={ask} unfinishedOnly /></details>}
    <IncidentDetails key={incident.id} incident={incident} busy={busy} safely={safely} editable={!finished.includes(incident.status)} />
    <Modal open={!!extra} onClose={() => { if (!busy) setExtra(null); }} title={extra === "drone" ? "Bantuan drone" : "Tugaskan regu"}><div className="dialog-body">{failure && <p className="inline-warning" role="alert">Tindakan belum berhasil. Silakan coba lagi.</p>}{extra === "drone" ? <DroneChoice incident={incident} data={data} busy={busy} safely={async (...args) => { try { await run(...args); setExtra(null); } catch {} }} /> : <TeamChoice incident={incident} data={data} busy={busy} safely={async (...args) => { try { await run(...args); setExtra(null); } catch {} }} />}</div></Modal>
  </section>;
}

function DroneChoice({ incident, data, busy, safely }: { incident: Incident; data: Bootstrap; busy: boolean; safely: Actions["safely"] }) {
  const [type, setType] = useState("suppression_simulation");
  const existing = data.missions.find(item => item.incident_id === incident.id && !terminal.includes(item.status));
  const drone = data.drones.find(item => item.id === "DRONE-01");
  const available = drone?.status === "available";
  const needsWater = type === "suppression_simulation" && !(drone && drone.payload_l > 0);
  if (existing) return <div className="empty-state"><h2>Drone sudah ditugaskan</h2><p>{label(existing.status)}. Tutup panel ini untuk mengikuti penanganan.</p></div>;
  return <><h2>Kirim bantuan dari udara</h2><p className="muted">Pilih tugas drone virtual untuk kejadian ini.</p><fieldset className="response-options"><legend className="sr-only">Tugas drone</legend>{[
    { value: "suppression_simulation", title: "Pindai & lepaskan air", text: "Memindai lokasi dan melepas air virtual." },
    { value: "reconnaissance", title: "Pindai area saja", text: "Memeriksa perkiraan lokasi dari udara." },
  ].map(option => <label key={option.value} className={type === option.value ? "selected" : ""}><input type="radio" name={`drone-task-${incident.id}`} value={option.value} checked={type === option.value} disabled={busy} onChange={() => setType(option.value)} /><span><strong>{option.title}</strong><small>{option.text}</small></span></label>)}</fieldset><p className="permission-copy">Dengan menyetujui, kamu mengizinkan drone virtual terbang, memindai{type === "suppression_simulation" ? ", melepas air virtual" : ""}, lalu pulang otomatis. Lokasi dan penerbangan merupakan simulasi.{type === "suppression_simulation" ? " Video pelepasan air menggunakan klip yang disiapkan untuk proyek." : ""}</p>{!available && <p className="inline-warning">Drone belum siap atau sedang digunakan. Kamu bisa menugaskan regu.</p>}{available && needsWater && <p className="inline-warning">Air virtual habis. Pilih pindai area saja atau tugaskan regu.</p>}<Button className="full-width" disabled={busy || !available || needsWater} onClick={() => safely(`/api/incidents/${incident.id}/respond`, { notes: incident.notes, mission_type: type })}>{busy ? "Mengirim…" : "Setujui & kirim drone"}</Button></>;
}

function TeamChoice({ incident, data, busy, safely }: { incident: Incident; data: Bootstrap; busy: boolean; safely: Actions["safely"] }) {
  const [unitId, setUnitId] = useState("");
  const available = data.response_units.filter(unit => unit.availability === "available");
  const selected = available.find(unit => unit.id === unitId);
  return <><h2>Tugaskan regu pemadam</h2><p className="muted">Regu menuju lokasi perkiraan. Penugasan dan pergerakan merupakan simulasi.</p><label className="field-label" htmlFor="response-unit">Regu yang tersedia</label><select id="response-unit" disabled={busy || !available.length} value={selected?.id || ""} onChange={event => setUnitId(event.target.value)}><option value="">Pilih regu</option>{available.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>{!available.length && <p className="inline-warning">Belum ada regu yang siap ditugaskan.</p>}<Button className="full-width" disabled={busy || !selected} onClick={() => safely(`/api/incidents/${incident.id}/dispatch`, { unit_id: selected!.id })}>Tugaskan regu </Button></>;
}

function MissionSummary({ mission, payload, allowLaunch = true, busy, ask }: { mission: Mission; payload: number; allowLaunch?: boolean } & Actions) {
  const steps = [!!mission.launched_at, !!mission.arrived_at, !!mission.location_refined_at, mission.status === "completed"];
  return <div className="mission-summary"><ol className="mission-progress">{["Berangkat", "Tiba", "Memindai", "Kembali"].map((name, index) => <li key={name} className={steps[index] ? "done" : ""}><span />{name}</li>)}</ol>
    {allowLaunch && mission.status === "proposed" && <Button disabled={busy} variant="outline" onClick={() => ask("Setujui misi virtual?", "Kamu menyetujui target perkiraan dan tugas drone ini.", `/api/missions/${mission.id}/approve`)}>Setujui rencana misi</Button>}
    {allowLaunch && mission.status === "approved" && <Button disabled={busy} variant="outline" onClick={() => ask("Terbangkan drone virtual?", "Drone akan menuju lokasi sesuai rencana yang disetujui.", `/api/missions/${mission.id}/launch`)}>Terbangkan drone</Button>}
    {!mission.automatic && mission.status === "on_site" && mission.mission_type === "suppression_simulation" && <Button disabled={busy || payload <= 0 || mission.abort_requested} variant="outline" onClick={() => ask("Lepaskan air virtual?", "Pelepasan air merupakan simulasi dan tidak menyatakan api padam. Video menggunakan klip pelepasan air yang disiapkan untuk proyek.", `/api/missions/${mission.id}/release-payload`, { liters: Math.min(5, payload), command_id: crypto.randomUUID() })}>Lepaskan air virtual</Button>}
    {!terminal.includes(mission.status) && <details className="disclosure"><summary>Kontrol drone</summary><div className="button-row">{["en_route", "on_site", "suppression_simulation"].includes(mission.status) && <Button size="sm" variant="outline" disabled={busy || mission.abort_requested} onClick={() => ask("Pulangkan drone?", "Drone virtual akan kembali ke pangkalan.", `/api/missions/${mission.id}/return`)}>Pulangkan</Button>}{mission.status !== "returning" && <Button size="sm" variant="destructive" disabled={busy || mission.abort_requested} onClick={() => ask("Hentikan misi?", "Drone yang sudah terbang akan kembali ke pangkalan sebelum tersedia lagi.", `/api/missions/${mission.id}/abort`)}>Hentikan misi</Button>}</div><p className="muted small">Tugas: {mission.mission_type === "reconnaissance" ? "pemindaian area" : "pemindaian dan pelepasan air virtual"}.</p></details>}
  </div>;
}

function IncidentDetails({ incident, busy, safely, editable }: { incident: Incident; busy: boolean; safely: Actions["safely"]; editable: boolean }) {
  const [notes, setNotes] = useState(incident.notes);
  const previousNotes = useRef(incident.notes);
  useEffect(() => {
    const previous = previousNotes.current;
    setNotes(current => current === previous ? incident.notes : current);
    previousNotes.current = incident.notes;
  }, [incident.notes]);
  const workspace = useWorkspace();
  return <details className="incident-details"><summary>Detail kejadian & catatan</summary><dl className="metadata"><dt>ID kejadian</dt><dd>{incident.id}</dd><dt>Lokasi perkiraan</dt><dd>{incident.latitude !== null && incident.longitude !== null ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}` : "Belum ditentukan"}</dd>{incident.provenance === "ai" && <><dt>Keyakinan model</dt><dd>{Math.round(incident.confidence * 100)}% · bukan ukuran akurasi</dd></>}{incident.location_uncertainty_m !== null && <><dt>Radius asumsi</dt><dd>±{Math.round(incident.location_uncertainty_m)} m · simulasi</dd></>}</dl>{editable && incident.status !== "pending_review" && <button className="text-button" disabled={busy} onClick={() => { workspace.selectIncident(incident.id); workspace.setPlacing(true); }}> Ubah lokasi perkiraan</button>}<label className="field-label" htmlFor="incident-note">Catatan operator</label><textarea id="incident-note" value={editable ? notes : incident.notes} disabled={!editable || busy} onChange={event => setNotes(event.target.value)} maxLength={4000} placeholder="Tambahkan hal yang perlu diketahui regu." />{editable && <Button variant="outline" size="sm" disabled={busy || notes === incident.notes} onClick={() => safely(`/api/incidents/${incident.id}`, { notes }, "PATCH")}>Simpan catatan</Button>}</details>;
}

function TeamProgress({ incident, data, busy, safely, ask, unfinishedOnly = false }: { incident: Incident; data: Bootstrap; unfinishedOnly?: boolean } & Actions) {
  return <>{data.dispatches.filter(item => item.incident_id === incident.id && (!unfinishedOnly || item.status !== "completed")).map(assignment => {
    const unit = data.response_units.find(item => item.id === assignment.unit_id);
    const next = ({ assigned: ["accepted", "Terima tugas"], accepted: ["responding", "Berangkat"], responding: ["on_site", "Tiba di lokasi"], on_site: ["completed", "Selesai tugas"] } as Record<string, string[]>)[assignment.status];
    return <div className="assignment-line" key={assignment.id}><div><strong>{unit?.name || assignment.unit_id}</strong><Status value={assignment.status} /></div>{next && <Button variant="outline" size="sm" disabled={busy} onClick={() => next[0] === "completed" ? ask("Selesaikan tugas regu?", "Tugas regu selesai. Kebakaran tetap perlu dinyatakan teratasi oleh operator.", `/api/dispatches/${assignment.id}/update-status`, { status: next[0] }) : safely(`/api/dispatches/${assignment.id}/update-status`, { status: next[0] })}>{next[1]}</Button>}</div>;
  })}</>;
}
