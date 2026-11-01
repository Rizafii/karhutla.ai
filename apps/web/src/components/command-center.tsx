"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ArrowLeft, ArrowRight, ChevronDown, WifiOff, X } from "lucide-react";
import { useOperations } from "@/lib/use-operations";
import { useWorkspace } from "@/lib/store";
import { request, label } from "@/lib/api";
import type { Camera } from "@/lib/types";
import { Button } from "./ui/button";
import { WorkspaceOverview, IncidentList } from "./workspace-overview";
import { IncidentFlow } from "./incident-flow";
import { Modal, CameraEditor, CameraPanel, ReportModal } from "./operator-support";

const MonitoringMap = dynamic(() => import("./monitoring-map"), { ssr: false });

export function CommandCenter({ onDrone, navbarTarget }: { onDrone: () => void; navbarTarget: HTMLElement | null }) {
  const { data, connected, error, refetch } = useOperations();
  const client = useQueryClient();
  const workspace = useWorkspace();
  const locked = useRef(false);
  const demoMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (demoMenu.current?.open && !demoMenu.current.contains(event.target as Node)) demoMenu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && demoMenu.current?.open) {
        demoMenu.current.open = false;
        demoMenu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [cameraDetail, setCameraDetail] = useState<Camera | null>(null);
  const [cameraEditor, setCameraEditor] = useState<Camera | null>(null);

  async function act(path: string, body: unknown = {}, method = "POST") {
    if (locked.current) throw new Error("Tindakan sebelumnya masih diproses.");
    locked.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await request(path, body, method);
      if (path === "/api/demo/reset" || path === "/api/demo/replay") {
        useWorkspace.setState({ incidentId: null, cameraId: null, reportId: null, placing: false });
      }
      await client.invalidateQueries({ queryKey: ["bootstrap"] });
      await client.invalidateQueries({ queryKey: ["report"] });
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "Koneksi belum tersedia.");
      throw cause;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const safely = (path: string, body: unknown = {}, method = "POST") => act(path, body, method).catch(() => {});
  function ask(title: string, message: string, path: string, body: unknown = {}) {
    setFailure(null);
    setConfirm({ title, message, action: () => act(path, body) });
  }
  function openIncident(id: string) {
    setMapOpen(false);
    setFailure(null);
    workspace.selectIncident(id);
    workspace.setView("incidents");
  }
  const back = () => { setFailure(null); workspace.setView("overview"); };

  if (!data) return <main className="empty-state boot"><WifiOff size={30} /><h1>{error ? "Belum bisa terhubung" : "Menyiapkan pantauan…"}</h1><p>{error ? "Pastikan layanan Karhutla sudah berjalan, lalu coba lagi." : "Data kamera dan kejadian sedang dimuat."}</p>{error && <Button onClick={() => refetch()}>Coba kembali</Button>}</main>;
  const incident = data.incidents.find(item => item.id === workspace.incidentId);
  const ready = data.worker_fresh && data.demo.worker.model_ready && data.demo.worker.footage_ready;
  const start = () => safely("/api/demo/scenarios/forest-sector-b/start", { mode: "ai" });
  const pause = () => safely("/api/demo/control", { paused: !data.demo.paused });
  const statusText = !connected ? "Menghubungkan ulang" : data.demo.status === "completed" ? "Pemantauan selesai" : data.demo.paused && data.demo.status === "running" ? "Pemantauan dijeda" : data.demo.mode === "manual_simulation" && data.demo.status === "running" ? "Simulasi manual berjalan" : !ready ? "AI belum siap" : data.demo.status === "running" ? "Pemantauan berjalan" : "Siap memantau";
  async function place(latitude: number, longitude: number) {
    if (!incident || busy) return;
    try {
      await act(`/api/incidents/${incident.id}`, { latitude, longitude }, "PATCH");
      workspace.setPlacing(false);
      setMapOpen(false);
    } catch {}
  }

  return <main className="workspace-main" aria-label={workspace.view === "settings" ? "Pengaturan" : workspace.view === "history" ? "Riwayat" : "Pantauan"}>
    {navbarTarget && data.demo_enabled && createPortal(<details className="demo-menu" ref={demoMenu}><summary> Demo <ChevronDown size={14} /></summary><div className="demo-popover">{data.demo_enabled && (data.demo.status === "running" ? <Button variant="outline" disabled={busy} onClick={pause}>{data.demo.paused ? "Lanjutkan" : "Jeda"}</Button> : data.demo.status === "idle" ? <Button disabled={busy || !ready} onClick={start}> Mulai pemantauan</Button> : <button className="text-button" onClick={() => ask("Ulangi pemantauan?", "Data kejadian dan laporan akan dihapus. Simpan laporan terlebih dahulu.", "/api/demo/replay", { mode: data.demo.mode })}>Pemantauan selesai · pengaturan <ArrowRight size={16} /></button>)}<section className="settings-section"><h2>Kontrol demo</h2><p role="status" className="muted">{statusText} · {data.demo.mode === "manual_simulation" ? "Simulasi manual" : "Deteksi AI pada video referensi"}</p><label className="field-label" htmlFor="demo-speed">Kecepatan simulasi</label><select id="demo-speed" value={data.demo.speed} disabled={busy} onChange={event => safely("/api/demo/control", { speed: Number(event.target.value) })}>{[1, 5, 8, 10].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select><div className="button-row settings-actions">{data.demo.status === "idle" && <Button variant="outline" disabled={busy} onClick={() => safely("/api/demo/scenarios/forest-sector-b/start", { mode: "manual_simulation" })}>Mulai simulasi manual</Button>}{data.demo.status === "running" && data.demo.mode === "manual_simulation" && <Button disabled={busy || data.demo.paused} onClick={() => safely("/api/demo/manual-event", {})}>Buat kejadian manual</Button>}{data.demo.status !== "idle" && <Button variant="outline" disabled={busy || (data.demo.mode === "ai" && !ready)} onClick={() => ask("Ulangi pemantauan?", "Data kejadian dan laporan akan dihapus. Simpan laporan yang diperlukan terlebih dahulu.", "/api/demo/replay", { mode: data.demo.mode })}> Ulangi pemantauan</Button>}<Button variant="destructive" disabled={busy} onClick={() => ask("Reset pemantauan?", "Kejadian, bukti, dan misi akan dihapus. Simpan laporan terlebih dahulu. Drone dan regu kembali siaga.", "/api/demo/reset")}>Reset pemantauan</Button></div></section></div></details>, navbarTarget)}
    {!connected && <p className="availability-note" role="status">Menghubungkan ulang ke layanan pemantauan.</p>}
    {failure && <div className="error-banner" role="alert"><div><strong>Tindakan belum berhasil. Silakan coba lagi.</strong><details><summary>Lihat detail</summary><p>{failure}</p></details></div><button className="icon-button" onClick={() => setFailure(null)} aria-label="Tutup pesan"><X size={17} /></button></div>}
    {workspace.view === "overview" && <>
      
      {!ready && data.demo.mode !== "manual_simulation" && <p className="availability-note">{!data.worker_fresh ? "Layanan AI belum terhubung." : !data.demo.worker.model_ready ? "Model deteksi belum siap." : "Video kamera belum siap."} Periksa kesiapan di Pengaturan.</p>}
      <WorkspaceOverview data={data} onIncident={openIncident} onMap={() => setMapOpen(true)} />
    </>}
    {workspace.view === "incidents" && (incident ? <IncidentFlow key={incident.id} incident={incident} data={data} busy={busy} safely={safely} run={act} failure={failure} ask={ask} onBack={back} onDrone={onDrone} /> : <div className="empty-state"><h1>Kejadian tidak tersedia</h1><p>Data mungkin sudah direset. Kembali untuk melihat pantauan terbaru.</p><Button variant="outline" onClick={back}>Kembali ke pantauan</Button></div>)}
    {workspace.view === "history" && <section className="history-page">{data.incidents.length ? <IncidentList incidents={[...data.incidents].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))} data={data} reports onSelect={id => data.incidents.find(item => item.id === id)?.status === "closed" && !data.missions.some(item => item.incident_id === id && !["completed", "cancelled", "aborted", "failed"].includes(item.status)) && !data.dispatches.some(item => item.incident_id === id && item.status !== "completed") ? workspace.setReport(id) : openIncident(id)} /> : <div className="empty-state"><h2>Belum ada catatan</h2><p>Kejadian yang diperiksa akan tersimpan di sini.</p></div>}</section>}
    {workspace.view === "settings" && <section className="settings-page"><button className="text-button back-link" onClick={back}><ArrowLeft size={17} /> Kembali ke pantauan</button>
      <section className="settings-section"><h2>Kamera</h2>{data.cameras.map(camera => <button className="settings-row" key={camera.id} onClick={() => setCameraDetail(camera)}><span><strong>{camera.name}</strong><small>{label(camera.connection_status)}</small></span><ArrowRight size={17} /></button>)}</section>

      <details className="disclosure"><summary>Kesiapan AI</summary><dl className="metadata"><dt>Layanan AI</dt><dd>{data.worker_fresh ? "Terhubung" : "Belum terhubung"}</dd><dt>Model deteksi</dt><dd>{data.demo.worker.model_ready ? "Siap" : "Belum siap"}</dd><dt>Video referensi</dt><dd>{data.demo.worker.footage_ready ? "Siap" : "Belum siap"}</dd><dt>Pemrosesan</dt><dd>{(data.demo.worker.inference_fps ?? 0).toFixed(2)} frame/detik</dd></dl></details>
    </section>}
    <AlertDialog.Root open={!!confirm} onOpenChange={open => { if (!open && !busy) setConfirm(null); }}><AlertDialog.Portal><AlertDialog.Overlay className="modal-overlay" /><AlertDialog.Content className="confirm-modal"><AlertDialog.Title>{confirm?.title}</AlertDialog.Title><AlertDialog.Description>{confirm?.message}</AlertDialog.Description>{failure && <p className="inline-warning" role="alert">Tindakan belum berhasil. Coba lagi atau batalkan untuk melihat detail.</p>}<div className="confirm-buttons"><AlertDialog.Cancel asChild><Button variant="outline" disabled={busy}>Batal</Button></AlertDialog.Cancel><Button disabled={busy} onClick={async () => { try { await confirm?.action(); setConfirm(null); } catch {} }}>{busy ? "Memproses…" : "Ya, lanjutkan"}</Button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>

    <Modal open={mapOpen || workspace.placing} onClose={() => { setMapOpen(false); workspace.setPlacing(false); }} title={workspace.placing ? "Ubah lokasi perkiraan" : "Peta pantauan"} wide><div className="dialog-body"><p className="muted">{workspace.placing ? "Klik peta untuk menetapkan perkiraan lokasi kejadian." : "Lokasi kamera, kejadian, dan respons virtual."}</p><div className="map-area map-dialog"><MonitoringMap data={data} onLocation={place} /></div>{failure && <p className="inline-warning" role="alert">Lokasi belum tersimpan. Coba pilih titik lagi setelah koneksi pulih.</p>}{mapOpen && workspace.incidentId && <Button variant="outline" onClick={() => openIncident(workspace.incidentId!)}>Buka kejadian terpilih</Button>}</div></Modal>
    <Modal open={!!cameraDetail && !cameraEditor} onClose={() => setCameraDetail(null)} title="Detail kamera">{cameraDetail && <CameraPanel camera={data.cameras.find(item => item.id === cameraDetail.id) || cameraDetail} onEdit={() => setCameraEditor(data.cameras.find(item => item.id === cameraDetail.id) || cameraDetail)} />}</Modal>
    {cameraEditor && <CameraEditor camera={cameraEditor} onClose={() => setCameraEditor(null)} save={act} busy={busy} />}
    <ReportModal id={workspace.reportId} onClose={() => workspace.setReport(null)} />
  </main>;
}
