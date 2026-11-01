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
