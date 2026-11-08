"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { API } from "@/lib/api";
import type { Camera } from "@/lib/types";

export function CameraStream({
  camera,
  annotated = false,
  compact = false,
}: {
  camera: Camera;
  annotated?: boolean;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    setFailed(false);
    setRetry((n) => n + 1);
  }, [camera.id, annotated]);
  useEffect(() => {
    if (
      !failed ||
      !["connected", "paused"].includes(camera.connection_status) ||
      (annotated && !["ready", "paused"].includes(camera.ai_status))
    )
      return;
    const timer = setTimeout(() => {
      setFailed(false);
      setRetry((n) => n + 1);
    }, 2500);
    return () => clearTimeout(timer);
  }, [failed, camera.connection_status, camera.ai_status, annotated]);
  if (
    camera.connection_status === "unavailable" ||
    camera.connection_status === "reconnecting" ||
    failed
  )
    return (
      <div className="video-empty">
        <WifiOff size={24} />
        <span>Video belum tersedia</span>
        <small>{camera.error ? "Sumber kamera belum bisa diakses" : "Periksa koneksi dan sumber kamera"}</small>
        {failed && !compact && (
          <button
            onClick={() => {
              setFailed(false);
              setRetry((n) => n + 1);
            }}
          >
            Coba kembali
          </button>
        )}
      </div>
    );
  return (
    <img
      className="camera-stream"
      src={`${API}/api/cameras/${camera.id}/stream.mjpg?annotated=${annotated}&v=${retry}`}
      alt={`Pantauan ${camera.id}${annotated ? " dengan tanda deteksi AI" : ""}`}
      onError={() => setFailed(true)}
    />
  );
}
