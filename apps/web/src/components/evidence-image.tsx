"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api";

export function EvidenceImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const [source, setSource] = useState<string | null>(null);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["evidence", path],
    queryFn: async ({ signal }) => {
      const response = await fetch(`${API}/api/evidence/${path.replace(/^evidence\//, "")}`, {
        cache: "no-store", signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
      });
      if (!response.ok) throw new Error("Bukti belum dapat dimuat");
      if (!response.headers.get("content-type")?.startsWith("image/")) throw new Error("Format bukti belum tersedia");
      const blob = await response.blob();
      if (!blob.size) throw new Error("Gambar bukti masih kosong");
      return blob;
    },
    retry: 4,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: Infinity,
    gcTime: 60000,
  });
  useEffect(() => {
    setDecodeFailed(false);
    if (!data) { setSource(null); return; }
    const url = URL.createObjectURL(data);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [data, path]);
  if (source && !decodeFailed) return <img className={className} src={source} alt={alt} onError={() => setDecodeFailed(true)} />;
  return <div className="evidence-loading" role="status" aria-live="polite" aria-busy={isFetching}>
    <strong>{isFetching || (!error && !decodeFailed) ? "Memuat gambar bukti..." : "Gambar bukti belum bisa dimuat"}</strong>
    <p>{isFetching ? "Mengambil bukti dari sumber. Halaman akan diperbarui otomatis." : "Coba muat ulang gambar tanpa menyegarkan halaman."}</p>
    {!isFetching && (error || decodeFailed) && <button className="text-button" onClick={() => { setDecodeFailed(false); setSource(null); void refetch(); }}>Muat ulang bukti</button>}
  </div>;
}
