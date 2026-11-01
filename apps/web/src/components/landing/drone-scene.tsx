"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createDrone } from "./drone-model";
import styles from "./landing.module.css";

export default function DroneScene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power", preserveDrawingBuffer: true }); }
    catch { return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    camera.position.set(0, 0, 13);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    const { group, rotors } = createDrone(); scene.add(group);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa2b3a5, 2.2));
    const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(-4, 6, 8); scene.add(light);
    element.appendChild(renderer.domElement);
    const hero = document.querySelector<HTMLElement>('[data-drone="hero"]');
    const intro = document.querySelector<HTMLElement>('[data-drone="intro"]');
    const steps = Array.from(document.querySelectorAll<HTMLElement>('[data-drone^="step-"]'));
    const rail = steps[0]?.parentElement?.previousElementSibling;
    let width = innerWidth, height = innerHeight, frame = 0, last = 0, lost = false;
    const resize = () => {
      width = innerWidth; height = innerHeight;
      renderer.setSize(width, height); renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.25 : 1.75));
      camera.aspect = width / height; camera.updateProjectionMatrix();
    };
    resize();
    const clamp = THREE.MathUtils.clamp;
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (lost || document.hidden || now - last < (width < 700 ? 33 : 16)) return;
      const dt = Math.min((now - last) / 1000, .05); last = now;
      const heroRect = hero?.getBoundingClientRect(), introRect = intro?.getBoundingClientRect();
      const small = width < 700;
      let px = width * .5, py = height * .52, scale = 1, rx = .35, ry = -.22, rz = -.04, visible = false;
      if (heroRect && heroRect.bottom > height * .2) {
        const field = hero?.firstElementChild?.getBoundingClientRect();
        const progress = clamp(-heroRect.top / height, 0, 1);
        px = width * (.5 + progress * .2); py = (field?.top ?? 80) + (field?.height ?? height * .7) * .57;
        scale = small ? .57 : Math.min(1.4, width / 1100); rx = .39 + progress * .12; ry = -.23 + progress * .55; visible = true;
      }
      if (introRect && introRect.top < height * .65 && introRect.bottom > height * .2) {
        const progress = clamp((height * .65 - introRect.top) / (height * .65), 0, 1);
        const targetX = width * (small ? .72 : .75), targetY = small ? introRect.top + introRect.height * .55 : height * .46;
        px = THREE.MathUtils.lerp(px, targetX, progress); py = THREE.MathUtils.lerp(py, targetY, progress);
        scale = small ? .38 : .95; rx = .16; ry = -.65 + progress * .25; rz = .08; visible = true;
      }
      if (!small && steps.length) {
        const first = steps[0].getBoundingClientRect(), end = steps[steps.length - 1].getBoundingClientRect();
        if (first.top < height * .75 && end.bottom > height * .3) {
          const progress = clamp((height * .5 - first.top) / (end.bottom - first.top), 0, .999);
          px = width * .255; py = height * .53; scale = Math.min(.83, width / 1600); rx = .35 + Math.sin(progress * Math.PI * 2) * .2; ry = -.5 + progress * Math.PI * 2; rz = .05; visible = true;
        }
      } else if (small && rail) {
        const rect = rail.getBoundingClientRect();
        if (rect.top < height && rect.bottom > 80) { px = width * .53; py = rect.top + rect.height * .48; scale = .34; rx = .45; ry = .25; visible = true; }
      }
      group.visible = visible;
      if (!visible) { renderer.clear(); return; }
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const viewWidth = viewHeight * camera.aspect;
      group.position.set((px / width - .5) * viewWidth, (.5 - py / height) * viewHeight + Math.sin(now * .00065) * .035, 0);
      // Keep mobile object fitting the narrower camera frustum.
      group.scale.setScalar(small ? scale * (width / 390) : scale);
      group.rotation.set(rx, ry, rz);
      rotors.forEach((rotor, i) => { rotor.rotation.y += dt * (i % 2 ? 5 : -5); });
      renderer.render(scene, camera);
    };
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; setReady(false); };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(render); setReady(true);
    return () => {
      cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => { if ("map" in material && material.map instanceof THREE.Texture) material.map.dispose(); material.dispose(); }); } });
      environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} className={styles.scene} data-ready={ready} aria-hidden="true" />;
}
