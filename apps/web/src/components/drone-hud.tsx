import type { Drone, Mission } from "@/lib/types";
import { worldPoint, bearing } from "@/lib/pov";

export function DroneHUD({ drone, mission, paused }: { drone: Drone; mission?: Mission; paused: boolean }) {
  const home = worldPoint(drone.home_latitude, drone.home_longitude);
  const target = mission ? worldPoint(mission.target_latitude, mission.target_longitude) : home;
  const total = Math.hypot(target.east - home.east, target.north - home.north);
  const phase = mission?.status ?? "standby";
  const moving = ["en_route", "returning"].includes(phase);
  const atTarget = ["on_site", "suppression_simulation"].includes(phase);
  const ended = ["completed", "aborted", "cancelled", "failed"].includes(phase);
  const progress = moving && mission ? Math.round(Math.max(0, Math.min(1, 1 - mission.distance_m / Math.max(1, total))) * 100) : atTarget || phase === "completed" ? 100 : 0;
  const here = worldPoint(drone.latitude, drone.longitude);
  const heading = moving ? (bearing(here, phase === "returning" ? home : target) + 360) % 360 : null;
  const titles: Record<string, string> = { standby: "STANDBY", proposed: "MISSION PLANNED", approved: "READY TO LAUNCH", en_route: "TARGET APPROACH", on_site: "AREA SCANNING", suppression_simulation: "PAYLOAD RELEASE", returning: "RETURN TO HOME", completed: "MISSION COMPLETE", aborted: "MISSION ABORTED", cancelled: "MISSION CANCELLED", failed: "MISSION FAILED" };
  const current = phase === "en_route" ? 0 : atTarget ? 1 : phase === "returning" ? 2 : phase === "completed" ? 3 : -1;
  return <div className="drone-hud" aria-label="Telemetri dan progres drone">
    <div className="hud-heading"><span className="hud-callsign">{drone.id}<small>FLIGHT CONTROL</small></span><span className="hud-mode">{paused ? "PAUSED" : titles[phase] ?? phase.toUpperCase()}</span><span className={`hud-battery ${drone.battery_pct < 25 ? "hud-battery-low" : ""}`}>BAT <strong>{drone.battery_pct.toFixed(0)}%</strong></span></div>
    <div className="hud-compass" aria-label="Arah penerbangan"><span>W</span><i /><span>N</span><i /><span>E</span><b>{heading === null ? "---" : `${heading.toFixed(0).padStart(3, "0")}?`}</b></div>
    <div className="hud-reticle" aria-hidden="true"><i /><b>+</b><span>{atTarget ? "AREA TARGET" : "NAVIGATION"}</span></div>
    <div className="hud-metrics"><div><span>ALT</span><strong>{drone.altitude_m.toFixed(0)}<small>m</small></strong></div><div><span>SPD</span><strong>{moving && !paused ? drone.speed_mps.toFixed(1) : "0.0"}<small>m/s</small></strong></div><div><span>LOAD</span><strong>{drone.payload_l.toFixed(1)}<small>L</small></strong></div></div>
    <div className="hud-route"><div className="hud-route-label"><span>{phase === "returning" ? "RUTE KEMBALI" : "RUTE KE TARGET"}</span><strong>{mission && (moving || atTarget || phase === "completed") ? `${progress}%` : "MENUNGGU MISI"}</strong></div><div className="hud-track" role="progressbar" aria-label={phase === "returning" ? "Progres kembali ke pangkalan" : "Progres menuju target"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></div><ol className="hud-stages">{["BERANGKAT", "DI TARGET", "KEMBALI", "SELESAI"].map((title, index) => <li key={title} data-active={index <= current} aria-current={index === current ? "step" : undefined}><i />{title}</li>)}</ol></div>
    <div className="hud-footer"><span>{drone.latitude.toFixed(5)}, {drone.longitude.toFixed(5)}</span><span>{mission && moving ? `${mission.distance_m.toFixed(0)} m / ETA ${mission.eta_s.toFixed(0)} s` : ended ? "FLIGHT ENDED" : "POSITION HOLD"}</span></div>
  </div>;
}
