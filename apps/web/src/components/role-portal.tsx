"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Bell, LayoutDashboard, History, Settings, ChevronDown, Plane, Radio, Shield, Volume2, VolumeX } from "lucide-react";
import { CommandCenter } from "./command-center";
import { FieldPanel } from "./field-panel";
import { DronePanel } from "./drone-panel";
import { request } from "@/lib/api";
import type { Bootstrap } from "@/lib/types";
import { useWorkspace } from "@/lib/store";

type Role = "operator" | "firefighter" | "drone";
const roles = [
  { id: "operator" as const, icon: Radio, name: "Operator", description: "Pantau kamera dan koordinasikan penanganan." },
  { id: "firefighter" as const, icon: Shield, name: "Petugas Damkar", description: "Terima tugas dan kabarkan perkembangan regu." },
  { id: "drone" as const, icon: Plane, name: "Pantauan Drone", description: "Ikuti perjalanan drone dari udara." },
];

export function RolePortal() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  const [role, setRole] = useState<Role>("operator");
  const menu = useRef<HTMLDetailsElement>(null);
  const [demoTarget, setDemoTarget] = useState<HTMLDivElement | null>(null);
  const view = useWorkspace(state => state.view);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  function choose(next: Role) {
    useWorkspace.setState({ view: "overview", cameraId: null, incidentId: null, placing: false, reportId: null });
    if (menu.current) menu.current.open = false;
    setRole(next);
  }
  function navigate(next: "overview" | "history" | "settings") {
    if (role !== "operator") choose("operator");
    useWorkspace.getState().setView(next);
    if (menu.current) menu.current.open = false;
  }
  return <QueryClientProvider client={client}>
    <div className="role-app">
      <header className="app-header">
        <button className="app-brand" onClick={() => navigate("overview")} aria-label="Karhutla, buka pantauan"><Image className="brand-mark" src="/logo.svg" alt="" width={36} height={36} />karhutla<span className="brand-dot">.</span></button>
        <span className="workspace-label">Forest monitoring <span>/</span> {role === "operator" ? view === "history" ? "Riwayat" : view === "settings" ? "Pengaturan" : "Overview" : roles.find(item => item.id === role)?.name}</span>
        <div className="header-tools">
          {role === "operator" && <div ref={setDemoTarget} />}
          <AlarmPanel onOpen={id => { choose("operator"); useWorkspace.getState().selectIncident(id); useWorkspace.getState().setView("incidents"); }} />
          <details className="header-menu" ref={menu}><summary aria-label="Peran dan pengaturan"><span className="menu-avatar">{role === "operator" ? <Radio size={17} /> : role === "firefighter" ? <Shield size={17} /> : <Plane size={17} />}</span><span className="menu-role">{roles.find(item => item.id === role)?.name}</span><ChevronDown size={14} /></summary><div className="menu-popover"><p>Ganti peran</p>{roles.map(item => <button key={item.id} className={role === item.id ? "selected" : ""} onClick={() => choose(item.id)}>{item.name}</button>)}<div className="menu-divider" /><button onClick={() => navigate("settings")}>Pengaturan</button></div></details>
        </div>
      </header>
      <aside className="app-sidebar">
        <span className="sidebar-caption">WORKSPACE</span>
        <nav aria-label="Navigasi utama">
          <button className={role === "operator" && ["overview", "incidents"].includes(view) ? "active" : ""} onClick={() => navigate("overview")}><LayoutDashboard size={18} />Overview</button>
          <button className={role === "operator" && view === "history" ? "active" : ""} onClick={() => navigate("history")}><History size={18} />Riwayat kejadian</button>

        </nav>
        <div className="sidebar-bottom"><button className={role === "operator" && view === "settings" ? "active" : ""} onClick={() => navigate("settings")}><Settings size={18} />Pengaturan</button><div className="forest-note"><span>JAGA HUTAN BERSAMA</span><strong>Deteksi lebih awal.<br />Respons lebih cepat.</strong><p>Pantau perubahan, verifikasi indikasi, koordinasikan penanganan.</p><div className="forest-lines" aria-hidden="true" /></div></div>
      </aside>
      {role === "operator" ? <CommandCenter navbarTarget={demoTarget} onDrone={() => choose("drone")} /> : role === "firefighter" ? <FieldPanel /> : <DronePanel onIncident={id => { choose("operator"); useWorkspace.getState().selectIncident(id); useWorkspace.getState().setView("incidents"); }} />}
    </div>
  </QueryClientProvider>;
}

function AlarmPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const { data } = useQuery({ queryKey: ["bootstrap"], queryFn: () => request<Bootstrap>("/api/bootstrap"), refetchInterval: 2000 });
  const [sound, setSound] = useState(false);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const pending = data?.incidents.filter(item => item.status === "pending_review") || [];
  const ids = pending.filter(item => !acknowledged.includes(item.id)).map(item => item.id).sort().join(",");
  useEffect(() => {
    if (!sound || !ids || !audio.current) return;
    const context = audio.current;
    const nodes: OscillatorNode[] = [];
    function pulse() {
      if (context.state !== "running") return;
      const oscillator = context.createOscillator(), gain = context.createGain(), at = context.currentTime;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(740, at);
      oscillator.frequency.setValueAtTime(540, at + .35);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(.045, at + .04);
      gain.gain.setValueAtTime(.045, at + .6);
      gain.gain.linearRampToValueAtTime(0, at + .75);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(at); oscillator.stop(at + .8);
      nodes.push(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); const index = nodes.indexOf(oscillator); if (index >= 0) nodes.splice(index, 1); };
    }
    pulse();
    const timer = setInterval(pulse, 2400);
    return () => { clearInterval(timer); nodes.forEach(node => { try { node.stop(); } catch {} }); };
  }, [sound, ids]);
  useEffect(() => () => { void audio.current?.close(); }, []);
  async function toggleSound() {
    if (sound) { setSound(false); return; }
    if (!window.confirm("Aktifkan suara alarm saat ada peringatan baru?")) return;
    try { audio.current ||= new AudioContext(); await audio.current.resume(); setSound(true); }
    catch { setSound(false); }
  }
  return <>
    <span className="sr-only" role="status">{pending.length ? `${pending.length} peringatan perlu diperiksa.` : "Tidak ada peringatan baru."}</span>
    <button className={`icon-button sound-button ${sound ? "enabled" : ""}`} onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Matikan suara alarm" : "Aktifkan suara alarm"} title={sound ? "Suara aktif" : "Suara mati"}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
    <button className="icon-button notification-button" disabled={!pending.length} aria-label={pending.length ? `Periksa ${pending.length} peringatan baru` : "Tidak ada peringatan baru"} title={pending.length ? "Periksa peringatan" : "Tidak ada peringatan baru"} onClick={() => { setAcknowledged(previous => [...previous, ...pending.map(item => item.id)]); onOpen(pending[0].id); }}><Bell size={19} />{!!pending.length && <span>{pending.length}</span>}</button>
  </>;
}
