"use client";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, Minimize2, Pause, Play, TriangleAlert, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { label, request, time } from "@/lib/api";
import type { Bootstrap } from "@/lib/types";
import { CameraStream } from "./camera-stream";
import { Button } from "./ui/button";
import "./cctv-wall.css";

export function CCTVWall({ data, onMap, onIncident }: {
  data: Bootstrap;
  onMap: () => void;
  onIncident: (id: string) => void;
}) {
  const wall = useRef<HTMLElement>(null);
  const client = useQueryClient();
  const [resuming, setResuming] = useState(false);
  const [annotated, setAnnotated] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const focused = data.cameras.find(camera => camera.id === focusedId);
  async function resume() {
    if (resuming) return;
    setResuming(true);
    setFailure(null);
    try {
      await request("/api/demo/control", { paused: false });
      await client.invalidateQueries({ queryKey: ["bootstrap"] });
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Pemantauan belum bisa dilanjutkan.");
    } finally { setResuming(false); }
  }
  const pauseNotice = data.demo.paused && <div className="cctv-pause-notice" role="status">
    <Pause size={16} /><span><strong>Pemantauan dijeda</strong><small>Gambar berhenti sampai pemantauan dilanjutkan.</small></span>
    <Button size="sm" disabled={resuming} onClick={resume}><Play size={14} />{resuming ? "Melanjutkan…" : "Lanjutkan"}</Button>
  </div>;
  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === wall.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  async function toggleFullscreen() {
    try {
      setFailure(null);
      if (document.fullscreenElement === wall.current) await document.exitFullscreen();
      else await wall.current?.requestFullscreen();
    } catch { setFailure("Layar penuh belum tersedia di browser ini. Gunakan tombol perbesar pada kamera."); }
  }

  return <section ref={wall} className="cctv-wall" aria-label="Pantauan semua kamera">
    <div className="cctv-toolbar">
      <div className="cctv-wall-title"><strong>Pantauan kamera</strong></div>
      <div className="cctv-controls">
        <button className={annotated ? "active" : ""} onClick={() => setAnnotated(value => !value)} aria-pressed={annotated}> Tanda deteksi</button>

        <button onClick={onMap}> Lihat peta</button>
        <button onClick={toggleFullscreen}>{fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}{fullscreen ? "Keluar layar penuh" : "Layar penuh"}</button>
      </div>
    </div>
    {failure && <p className="cctv-failure" role="alert">{failure}</p>}
    {pauseNotice}
    {!data.cameras.length && <div className="empty-state"><h2>Kamera belum tersedia</h2><p>Sumber kamera dapat diatur melalui menu Pengaturan.</p></div>}
    <div className="cctv-grid">
      {data.cameras.map(camera => {
        const incident = data.incidents.find(item => item.camera_id === camera.id && !["closed", "resolved", "false_alarm"].includes(item.status));
        return <article className={`cctv-preview cctv-video ${incident ? "has-incident" : ""}`} key={camera.id} aria-label={`Monitor ${camera.id}`}>
            {!focused && <CameraStream camera={camera} annotated={annotated} />}
            <span className="camera-name-badge" title={`${camera.id} / ${camera.name}`}>{camera.name}</span>
            <button className="camera-expand" onClick={() => setFocusedId(camera.id)} aria-label={`Perbesar ${camera.id}`} title="Perbesar kamera"><Maximize2 size={15} /></button>
            {incident && <button className="cctv-incident" onClick={() => onIncident(incident.id)}><TriangleAlert size={15} /><span>{incident.category === "smoke" ? "Indikasi asap" : "Indikasi api"}</span><strong>Periksa →</strong></button>}
        </article>;
      })}
    </div>
    <div className="cctv-wall-foot"><span>AI mendeteksi asap dan api · alarm menunggu verifikasi operator</span></div>
    <Dialog.Root open={!!focused} onOpenChange={open => { if (!open) setFocusedId(null); }}>
      <Dialog.Portal container={fullscreen ? wall.current ?? undefined : undefined}>
        <Dialog.Overlay className="modal-overlay cctv-focus-overlay" />
        <Dialog.Content className="modal cctv-focus">
          <div className="cctv-focus-heading">
            <div><span className="cctv-focus-eyebrow">PANTAUAN KAMERA · {focused?.id}</span><Dialog.Title>{focused?.name}</Dialog.Title></div>
            <Dialog.Close asChild><Button size="icon" variant="ghost" aria-label="Tutup kamera"><X size={20} /></Button></Dialog.Close>
          </div>
          <div className="cctv-focus-toolbar">
            <div className="cctv-view-switch" role="group" aria-label="Tampilan kamera">
              <button aria-pressed={!annotated} onClick={() => setAnnotated(false)}>Video asli</button>
              <button aria-pressed={annotated} onClick={() => setAnnotated(true)}>Tanda deteksi AI</button>
            </div>
            <span className={`cctv-focus-status ${focused?.connection_status}`}><i />{data.demo.paused ? "Dijeda" : focused ? label(focused.connection_status) : ""}</span>
          </div>
          <Dialog.Description className="sr-only">Pantauan kamera diperbesar. Pilih video asli atau tanda deteksi AI. Tekan Escape untuk menutup.</Dialog.Description>
          {pauseNotice}
          {failure && <p className="cctv-failure" role="alert">{failure}</p>}
          {focused && <div className="cctv-focus-video"><CameraStream camera={focused} annotated={annotated} /></div>}
          <div className="cctv-focus-footer">
            <label>Ganti kamera<select value={focusedId ?? ""} onChange={event => setFocusedId(event.target.value)}>{data.cameras.map(camera => <option key={camera.id} value={camera.id}>{camera.name} · {camera.id}</option>)}</select></label>
            <div><span>{focused?.source_type === "mp4" ? "Rekaman referensi · diputar ulang" : "Sumber kamera"}</span><small>Gambar terakhir {time(focused?.last_frame_at)}</small></div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}
