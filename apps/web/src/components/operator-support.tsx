"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { TriangleAlert, X } from "lucide-react";
import { Button } from "./ui/button";
import { CameraStream as Stream } from "./camera-stream";
import { EvidenceImage } from "./evidence-image";
import { request, label, time } from "@/lib/api";
import type { Camera, Incident, Report, Event } from "@/lib/types";
export type Actions = {
  busy: boolean;
  safely: (path: string, body?: unknown, method?: string) => Promise<void>;
  ask: (title: string, message: string, path: string, body?: unknown) => void;
};
const eventName: Record<string, string> = {
  "incident.created": "Indikasi baru ditemukan",
  "incident.confirmed": "Kejadian dikonfirmasi operator",
  "incident.location_refined": "Titik diperbarui oleh pemindaian drone virtual",
  "mission.scan_completed": "Pemindaian virtual selesai",
  "mission.automation_authorized": "Respons otomatis diizinkan operator",
  "incident.rejected": "Ditandai bukan kebakaran",
  "incident.updated": "Kejadian diperbarui",
  "mission.created": "Rencana misi dibuat",
  "mission.approved": "Misi disetujui operator",
  "mission.started": "Drone virtual diluncurkan",
  "mission.arrived": "Drone tiba di target",
  "mission.payload_released": "Air virtual dilepaskan",
  "mission.completed": "Drone kembali ke pangkalan",
  "mission.abort_requested": "Operator meminta penghentian misi",
  "mission.aborted": "Drone kembali setelah misi dihentikan",
  "dispatch.created": "Regu ditugaskan",
  "dispatch.updated": "Status regu diperbarui",
  "detection.validated": "Deteksi AI diperiksa berulang",
  "camera.status_changed": "Status kamera berubah",
  "demo.started": "Skenario demo dimulai",
  "demo.reset": "Skenario direset",
  "demo.updated": "Kontrol simulasi diperbarui",
};
export function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value}`}>
      <i />
      {label(value)}
    </span>
  );
}
export function Provenance({ incident }: { incident: Incident }) {
  return (
    <span
      className={`provenance ${incident.provenance === "ai" ? "real" : "sim"}`}
    >
      {incident.provenance === "ai" ? (
        <>
           Deteksi AI
        </>
      ) : (
        <>Simulasi manual</>
      )}
    </span>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal ${wide ? "modal-wide" : ""}`}>
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Tutup">
                <X size={18} />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Informasi dan kontrol operasional KARHUTLA.AI.
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


function Empty({ text }: { text: string }) {
  return <div className="empty-small">{text}</div>;
}
export function Timeline({ events }: { events: Event[] }) {
  return (
    <div className="timeline">
      {events.length ? (
        events.map((event) => (
          <div className="timeline-event" key={event.event_id}>
            <i />
            <div>
              <strong>{eventName[event.type] || "Aktivitas diperbarui"}</strong>
              <small>
                {String(
                  event.data.camera_id ||
                    event.data.mission_id ||
                    event.data.unit_id ||
                    event.data.incident_id ||
                    "Sistem",
                )}
                {event.data.provenance === "manual_simulation"
                  ? " · SIMULASI"
                  : ""}
              </small>
            </div>
            <time>{time(event.timestamp)}</time>
          </div>
        ))
      ) : (
        <Empty text="Belum ada aktivitas tersimpan." />
      )}
    </div>
  );
}
export function CameraPanel({
  camera,
  onEdit,
}: {
  camera: Camera;
  onEdit: () => void;
}) {
  const [annotated, setAnnotated] = useState(false);
  const { data: detections = [] } = useQuery({
    queryKey: ["detections", camera.id],
    queryFn: () =>
      request<
        {
          id: string;
          category: string;
          confidence: number;
          captured_at: string;
          provenance: string;
        }[]
      >(`/api/cameras/${camera.id}/detections`),
    refetchInterval: 5000,
  });
  return (
    <div className="detail-body">
      <div className="detail-kicker">{camera.id}</div>
      <h2>{camera.name}</h2>
      <div className="status-row">
        <Status value={camera.connection_status} />
        <Status value={camera.ai_status} />
      </div>
      <div className="detail-video">
        <Stream camera={camera} annotated={annotated} />
      </div>
      {camera.source_config.normal === "/videos/normal.mp4" && (
        <p className="footage-attribution">
          <a
            href="https://www.pexels.com/video/aerial-view-of-wildfire-with-heavy-smoke-31129956/"
            target="_blank"
            rel="noreferrer"
          >
            8K / Pexels
          </a>{" "}
          · footage referensi, bukan rekaman Kalimantan.
        </p>
      )}
      <div className="segmented">
        <button
          className={!annotated ? "active" : ""}
          onClick={() => setAnnotated(false)}
        >
          Preview
        </button>
        <button
          className={annotated ? "active" : ""}
          onClick={() => setAnnotated(true)}
        >
          Tanda deteksi AI
        </button>
      </div>
      <dl className="metadata">
        <dt>Lokasi demo</dt>
        <dd>
          {camera.latitude.toFixed(5)}, {camera.longitude.toFixed(5)}
        </dd>
        <dt>Azimuth / FOV</dt>
        <dd>
          {camera.heading}° / {camera.fov}°
        </dd>
        <dt>Jangkauan perkiraan</dt>
        <dd>{camera.range_m} m</dd>
        <dt>Sumber</dt>
        <dd>{camera.source_type.toUpperCase()}</dd>
        <dt>Frame terakhir</dt>
        <dd>{time(camera.last_frame_at)} WIB</dd>
        <dt>Pemrosesan AI terakhir</dt>
        <dd>{time(camera.last_inference_at)} WIB</dd>
        <dt>Deteksi terakhir</dt>
        <dd>{time(camera.last_detection_at)} WIB</dd>
      </dl>
      <Button variant="outline" className="full-width" onClick={onEdit}>
        
        Konfigurasi kamera
      </Button>
      <div className="divider-label">Hasil deteksi AI</div>
      {detections.length ? (
        detections.slice(0, 8).map((d) => (
          <div className="detection-row" key={d.id}>
            <span>
              {d.category}{" "}
              <small>
                {d.provenance === "ai"
                  ? `${(d.confidence * 100).toFixed(1)}%`
                  : "SIMULASI"}
              </small>
            </span>
            <time>{time(d.captured_at)}</time>
          </div>
        ))
      ) : (
        <Empty text="Belum ada deteksi tervalidasi." />
      )}
      <p className="help-text">
        Keyakinan model bukan ukuran akurasi. Frame AI
        beranotasi memiliki timestamp sendiri.
      </p>
    </div>
  );
}

export function ReportModal({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data, error, refetch } = useQuery({
    queryKey: ["report", id],
    queryFn: ({ signal }) => request<Report>(`/api/incidents/${id}/report`, undefined, "GET", signal),
    enabled: !!id,
    refetchInterval: id ? 5000 : false,
  });
  function download() {
    if (!data) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.id}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Modal
      open={!!id}
      onClose={onClose}
      title="Laporan kejadian"
      wide
    >
      {error ? (
        <div className="empty-state"><h2>Laporan belum bisa dimuat</h2><p>Periksa koneksi, lalu coba kembali.</p><Button variant="outline" onClick={() => refetch()}>Coba kembali</Button></div>
      ) : !data ? (
        <p>Memuat laporan…</p>
      ) : (
        <div className="report-body">
          <div className="report-header">
            <div>
              <small>{data.id}</small>
              <h2>
                {data.camera_id} ·{" "}
                {data.category === "smoke" ? "Indikasi asap" : "Indikasi api"}
              </h2>
              <Provenance incident={data} />
            </div>
            <Status value={data.status} />
            <Button size="sm" onClick={() => window.print()}>Cetak laporan</Button>
            <details className="report-export"><summary>Ekspor lainnya</summary><Button variant="outline" size="sm" onClick={download}> Unduh JSON</Button></details>
          </div>
          <div className="report-grid">
            <div>
              {data.evidence_path ? (
                <EvidenceImage key={data.evidence_path} className="report-image" path={data.evidence_path} alt="Bukti kejadian" />
              ) : (
                <div className="evidence-manual">
                  <TriangleAlert />
                  <strong>Simulasi manual</strong>
                  <span>Tidak ada gambar bukti dari AI.</span>
                </div>
              )}
              <dl className="metadata">
                <dt>Deteksi</dt>
                <dd>{time(data.created_at)} WIB</dd>
                <dt>Verifikasi</dt>
                <dd>{time(data.verified_at)} WIB</dd>
                <dt>Resolusi</dt>
                <dd>{time(data.resolved_at)} WIB</dd>
                <dt>Deteksi → verifikasi</dt>
                <dd>
                  {data.intervals.detection_to_verification_s?.toFixed(1) ??
                    "—"}{" "}
                  s aktual
                </dd>
                <dt>Lokasi perkiraan</dt>
                <dd>
                  {data.latitude?.toFixed(5) ?? "Belum diisi"},{" "}
                  {data.longitude?.toFixed(5) ?? "—"}
                </dd>
              </dl>
              <p className="help-text">
                {data.notes || "Tidak ada catatan operator."}
              </p>
              {data.missions.map((m) => (
                <div className="report-mission" key={m.id}>
                  <strong>{m.id}</strong>
                  <dl className="metadata">
                    <dt>Drone berangkat</dt>
                    <dd>{time(m.launched_at)}</dd>
                    <dt>Tiba di lokasi</dt>
                    <dd>{time(m.arrived_at)}</dd>
                    <dt>Misi selesai</dt>
                    <dd>{time(m.completed_at)}</dd>
                    <dt>Waktu perjalanan aktual</dt>
                    <dd>{m.travel_wall_seconds?.toFixed(1) ?? "—"} s</dd>
                    <dt>Durasi simulasi</dt>
                    <dd>{m.simulation_elapsed_s.toFixed(1)} s</dd>
                    <dt>Status</dt>
                    <dd>{label(m.status)}</dd>
                  </dl>
                </div>
              ))}
              {data.dispatches.map((d) => (
                <p key={d.id} className="help-text">
                  {d.unit_id} · ditugaskan {time(d.created_at)} ·{" "}
                  {label(d.status)}
                </p>
              ))}
            </div>
            <div>
              <div className="divider-label">Urutan penanganan</div>
              <Timeline events={data.timeline} />
            </div>
          </div>
          <p className="report-disclaimer">{data.disclaimer}</p>
        </div>
      )}
    </Modal>
  );
}
export function CameraEditor({
  camera,
  onClose,
  save,
  busy,
}: {
  camera: Camera;
  onClose: () => void;
  save: Actions["safely"];
  busy: boolean;
}) {
  const [normal, setNormal] = useState(String(camera.source_config.normal ?? "")),
    [scenario, setScenario] = useState(String(camera.source_config.scenario ?? "")),
    [heading, setHeading] = useState(camera.heading),
    [fov, setFov] = useState(camera.fov),
    [range, setRange] = useState(camera.range_m),
    [error, setError] = useState("");
  async function submit() {
    const source_config = { normal: normal.trim(), ...(scenario.trim() ? { scenario: scenario.trim() } : {}) };
    try {
      await save(
        `/api/cameras/${camera.id}`,
        {
          source_type: "mp4",
          source_config,
          heading,
          fov,
          range_m: range,
        },
        "PATCH",
      );
      onClose();
    } catch (error) {
      setError((error as Error).message);
    }
  }
  return (
    <Modal open onClose={onClose} title={`Konfigurasi ${camera.id}`}>
      <div className="editor-body">
        <p className="help-text">Pemantauan menggunakan rekaman video MP4 yang diputar ulang.</p>
        <label className="field-label" htmlFor="video-normal">Video utama</label>
        <input id="video-normal" value={normal} onChange={e => setNormal(e.target.value)} placeholder="/videos/normal.mp4" />
        <label className="field-label" htmlFor="video-scenario">Video skenario (opsional)</label>
        <input id="video-scenario" value={scenario} onChange={e => setScenario(e.target.value)} placeholder="/videos/scenario.mp4" />
        <p className="help-text">Simpan file di assets/videos, lalu gunakan path /videos/nama.mp4. Video skenario dipakai pada CAM-002 saat demo AI. Perubahan memulai ulang pemutaran.</p>
        <div className="editor-numbers">
          <label>
            Azimuth
            <input
              type="number"
              value={heading}
              min="0"
              max="359"
              onChange={(e) => setHeading(Number(e.target.value))}
            />
          </label>
          <label>
            FOV
            <input
              type="number"
              value={fov}
              min="1"
              max="180"
              onChange={(e) => setFov(Number(e.target.value))}
            />
          </label>
          <label>
            Range (m)
            <input
              type="number"
              value={range}
              min="1"
              max="20000"
              onChange={(e) => setRange(Number(e.target.value))}
            />
          </label>
        </div>
        {error && <p role="alert">{error}</p>}
        <Button disabled={busy} onClick={submit}>
          Simpan konfigurasi
        </Button>
      </div>
    </Modal>
  );
}
