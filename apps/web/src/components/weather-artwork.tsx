import { useId } from "react";

/** Lightweight vector illustrations, colored to match a weather app. */
export function WeatherArtwork({ code, small = false, night = false }: { code: number | null; small?: boolean; night?: boolean }) {
  const id = useId().replace(/:/g, "");
  const known = code !== null && [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 97, 99].includes(code);
  const cloudy = code !== null && code > 0;
  const wet = code !== null && code >= 51;
  const snow = code !== null && [71, 73, 75, 77, 85, 86].includes(code);
  const storm = code !== null && code >= 95;
  const fog = code === 45 || code === 48;
  return <svg className={`weather-artwork${small ? " small" : ""}`} viewBox="0 0 120 100" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-sun`} x1="38" y1="8" x2="72" y2="62" gradientUnits="userSpaceOnUse"><stop stopColor="#ffe58a" /><stop offset="1" stopColor="#ffab35" /></linearGradient>
      <linearGradient id={`${id}-cloud`} x1="55" y1="30" x2="75" y2="80" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset="1" stopColor="#b4d4f2" /></linearGradient>
      <linearGradient id={`${id}-moon`} x1="35" y1="15" x2="75" y2="65" gradientUnits="userSpaceOnUse"><stop stopColor="#c9d9ff" /><stop offset="1" stopColor="#779bf1" /></linearGradient>
      <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#7daccd" floodOpacity=".22" /></filter>
    </defs>
    {known && <>
      {night ? <path d="M68 13a26 26 0 1 0 15 43A27 27 0 0 1 68 13Z" fill={`url(#${id}-moon)`} /> : <g><g stroke="#ffd16a" strokeWidth="3" strokeLinecap="round">{Array.from({ length: 8 }, (_, i) => <path key={i} d="M51 8v6" transform={`rotate(${i * 45} 51 38)`} />)}</g><circle cx="51" cy="38" r="21" fill={`url(#${id}-sun)`} /></g>}
      {cloudy && <path d="M34 72a17 17 0 0 1-1-34 23 23 0 0 1 43-4 19 19 0 0 1 5 38H34Z" fill={`url(#${id}-cloud)`} filter={`url(#${id}-shadow)`} />}
      {wet && !snow && !storm && <g stroke="#5baff0" strokeWidth="4" strokeLinecap="round"><path d="m43 81-4 8m21-8-4 8m21-8-4 8" /></g>}
      {snow && <g fill="#8cc9ef"><circle cx="40" cy="86" r="3" /><circle cx="60" cy="90" r="3" /><circle cx="80" cy="85" r="3" /></g>}
      {storm && <path d="m62 67-13 18h12l-5 13 23-23H65l6-8Z" fill="#ffc547" />}
      {fog && <g stroke="#a1bfd4" strokeWidth="3" strokeLinecap="round"><path d="M30 80h61M39 88h45" /></g>}
    </>}
    {!known && <path d="M29 71a18 18 0 0 1 1-36 24 24 0 0 1 44-2 20 20 0 0 1 8 38H29Z" fill={`url(#${id}-cloud)`} />}
  </svg>;
}
