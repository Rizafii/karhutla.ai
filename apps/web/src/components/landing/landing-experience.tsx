"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./landing.module.css";

const DroneScene = dynamic(() => import("./drone-scene"), { ssr: false });

export function LandingExperience() {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!preference.matches);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return <><div className={styles.poster} aria-hidden="true"><img src="/landing/drone-poster.webp" alt="" /></div>{animate && <DroneScene />}</>;
}

export function LandingMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className={styles.menu} ref={container}><button ref={toggle} className={styles.menuButton} aria-expanded={open} aria-controls="landing-menu" onClick={() => setOpen(!open)}>Menu <span aria-hidden="true">{open ? "−" : "+"}</span></button>{open && <nav id="landing-menu" className={styles.menuPanel} aria-label="Navigasi landing page">{[["tentang", "Tentang sistem"], ["pemantauan", "Pemantauan"], ["alur", "Alur kerja"], ["platform", "Platform"]].map(([id, title], i) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}><span>0{i + 1}</span>{title} ↗</a>)}</nav>}</div>;
}

export function ForestFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const sync = () => {
      if (!inView || preference.matches || document.hidden || manuallyPaused.current) element.pause();
      else void element.play().catch(() => {});
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: 0.15 });
    observer.observe(element); preference.addEventListener("change", sync); document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, []);
  return <><video ref={video} className={styles.forestVideo} poster="/landing/forest-poster.webp" muted loop playsInline preload="none" onError={() => setFailed(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}><source src="/landing/forest.mp4" type="video/mp4" /></video>{!failed && <button className={styles.filmControl} aria-label={playing ? "Jeda video hutan" : "Putar video hutan"} onClick={() => { const element = video.current; if (!element) return; manuallyPaused.current = playing; if (playing) element.pause(); else void element.play().catch(() => setFailed(true)); }}>{playing ? "Ⅱ" : "▷"}</button>}</>;
}

export function LandingDroneHUD({ workflow = false }: { workflow?: boolean }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const target = document.querySelector(workflow ? '[data-drone="step-0"]' : '[data-drone="hero"]');
      if (!target) return;
      const rect = (workflow ? target.parentElement : target)?.getBoundingClientRect();
      if (!rect) return;
      const fraction = workflow ? (innerHeight * .5 - rect.top) / Math.max(1, rect.height) : -rect.top / Math.max(1, rect.height);
      setProgress(Math.round(Math.max(0, Math.min(1, fraction)) * 100));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [workflow]);
  const labels = ["OBSERVATION", "VERIFICATION", "COORDINATION", "EVALUATION"];
  const current = Math.min(3, Math.floor(progress / 25));
  return <div className={styles.landingHud}>
    <div className={styles.landingHudTop}><span><i /> UAV / 01</span><span>SYS.OVERVIEW</span></div>
    <div className={styles.landingHudScope} aria-hidden="true"><i /><span>+</span><b /></div>
    <div className={styles.landingHudReadout}><span>{workflow ? labels[current] : "FOREST INTELLIGENCE"}</span><strong>{String(progress).padStart(2, "0")}<small>%</small></strong></div>
    <div className={styles.landingHudTrack} role="progressbar" aria-label="Progres penjelajahan halaman" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></div>
    <div className={styles.landingHudFooter}><span>SCROLL PROGRESS</span><span>{workflow ? `STAGE 0${current + 1} / 04` : "EXPLORE SYSTEM"}</span></div>
  </div>;
}
