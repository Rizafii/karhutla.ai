export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/events";
export async function request<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail),
    );
  }
  return response.json();
}
export const statusNames: Record<string, string> = {
  pending_review: "Perlu diperiksa",
  confirmed: "Sudah diperiksa",
  dispatched: "Ditugaskan",
  in_progress: "Sedang ditangani",
  resolved: "Teratasi",
  false_alarm: "Bukan kebakaran",
  closed: "Ditutup",
  proposed: "Menunggu persetujuan",
  approved: "Disetujui",
  en_route: "Menuju target",
  on_site: "Di lokasi",
  suppression_simulation: "Melepas air virtual",
  returning: "Kembali ke pangkalan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  aborted: "Misi dihentikan",
  failed: "Gagal",
  available: "Siaga",
  reserved: "Disiapkan",
  assigned: "Ditugaskan",
  accepted: "Diterima",
  responding: "Merespons",
  standby: "Siaga",
  connected: "Terhubung",
  reconnecting: "Menghubungkan",
  unavailable: "Tidak tersedia",
  ready: "AI siap",
  processing: "Memeriksa gambar",
  paused: "Dijeda",
  idle: "Siap",
  running: "Berjalan",
  error: "Perlu perhatian",
};
export const label = (value: string) => statusNames[value] || value;
export const time = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";
