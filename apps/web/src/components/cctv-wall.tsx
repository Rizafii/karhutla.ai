"use client";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, Minimize2, TriangleAlert, X } from "lucide-react";
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
  const [annotated, setAnnotated] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const focused = data.cameras.find(camera => camera.id === focusedId);
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
    {!data.cameras.length && <div className="empty-state"><h2>Kamera belum tersedia</h2><p>Sumber kamera dapat diatur melalui menu Pengaturan.</p></div>}
    <div className="cctv-grid">
      {data.cameras.map(camera => {
        const incident = data.incidents.find(item => item.camera_id === camera.id && !["closed", "resolved", "false_alarm"].includes(item.status));
        return <article className={`cctv-preview cctv-video ${incident ? "has-incident" : ""}`} key={camera.id} aria-label={`Monitor ${camera.id}`}>
            <CameraStream camera={camera} annotated={annotated} />
            <span className="camera-name-badge" title={`${camera.id} / ${camera.name}`}>{camera.name}</span>
            <button className="camera-expand" onClick={() => setFocusedId(camera.id)} aria-label={`Perbesar ${camera.id}`} title="Perbesar kamera"><Maximize2 size={15} /></button>
            {incident && <button className="cctv-incident" onClick={() => onIncident(incident.id)}><TriangleAlert size={15} /><span>{incident.category === "smoke" ? "Indikasi asap" : "Indikasi api"}</span><strong>Periksa →</strong></button>}
        </article>;
      })}
    </div>
    <div className="cctv-wall-foot"><span>AI mendeteksi asap dan api · alarm menunggu verifikasi operator</span></div>
    <Dialog.Root open={!!focused} onOpenChange={open => { if (!open) setFocusedId(null); }}>
      <Dialog.Portal container={fullscreen ? wall.current ?? undefined : undefined}>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal modal-wide cctv-focus">
          <div className="modal-heading"><Dialog.Title>{focused?.id} · {focused?.name}</Dialog.Title><Dialog.Close asChild><Button size="icon" variant="ghost" aria-label="Tutup kamera"><X size={18} /></Button></Dialog.Close></div>
          <Dialog.Description className="cctv-focus-description">{annotated ? "Hasil deteksi AI pada gambar kamera" : "Pantauan kamera diperbesar"}</Dialog.Description>
          {focused && <div className="cctv-focus-video"><CameraStream camera={focused} annotated={annotated} /></div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}
