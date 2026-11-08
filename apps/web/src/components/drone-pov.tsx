"use client";
import { useEffect, useRef, useState } from "react";
import { API } from "@/lib/api";
import type { Drone, Mission } from "@/lib/types";
import { worldPoint } from "@/lib/pov";

export function DronePOV({ drone, mission, paused, speed }: { drone: Drone; mission?: Mission; paused: boolean; speed: number }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const scanning = !!mission && ["on_site", "suppression_simulation"].includes(mission.status);
  const releasing = mission?.status === "suppression_simulation";
  const travelling = mission?.status === "en_route";
  const returning = mission?.status === "returning";
  const clip = releasing ? "payload-drop" : scanning ? "drone-fire" : travelling ? "drone-approach" : "forest";

  useEffect(() => { setFailed(false); setRetry(0); }, [clip]);
  useEffect(() => {
    if (!failed || retry >= 4) return;
    const timer = setTimeout(() => { setFailed(false); setRetry(value => value + 1); }, Math.min(1000 * 2 ** retry, 8000));
    return () => clearTimeout(timer);
  }, [failed, retry]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let disposed = false;
    const playbackFailed = (error: unknown) => {
      if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
    };
    const sync = () => {
      if (travelling && mission && Number.isFinite(element.duration)) {
        const home = worldPoint(drone.home_latitude, drone.home_longitude);
        const target = worldPoint(mission.target_latitude, mission.target_longitude);
        const total = Math.hypot(target.east - home.east, target.north - home.north);
        const progress = Math.max(0, Math.min(1, 1 - mission.distance_m / Math.max(1, total)));
        // Reference footage follows route progress; it is labelled as a replay.
        const desired = progress * Math.max(0, element.duration - .1);
        if (Math.abs(element.currentTime - desired) > .75) element.currentTime = desired;
        element.playbackRate = Math.max(.1, Math.min(4, element.duration * drone.speed_mps * speed / Math.max(1, total)));
        if (paused) element.pause();
        else void element.play().catch(playbackFailed);
      } else if (paused || (!scanning && !returning)) {
        element.pause();
      } else {
        if (releasing && element.ended) return;
        void element.play().catch(playbackFailed);
      }
    };
    sync();
    element.addEventListener("loadedmetadata", sync);
    return () => { disposed = true; element.removeEventListener("loadedmetadata", sync); };
  }, [clip, retry, paused, scanning, releasing, travelling, returning, speed, mission, drone.home_latitude, drone.home_longitude, drone.speed_mps]);

  return <>
    <video key={`${clip}:${retry}`} ref={video} className="drone-pov-canvas" src={`${API}/api/footage/${clip}?retry=${retry}`} muted playsInline loop={!releasing} preload="auto" onError={() => setFailed(true)} aria-label={releasing ? "Pelepasan air untuk penanganan kebakaran hutan" : scanning ? "Footage udara kebakaran hutan" : "Footage drone mendekati area asap di hutan"} />
    {failed && <div className="pov-footage-error" role="alert">{retry < 4 ? "Menghubungkan ulang video drone..." : <>Video drone belum bisa dimuat. <button className="text-button" onClick={() => { setFailed(false); setRetry(0); video.current?.load(); }}>Muat ulang video</button></>}</div>}
  </>;
}
