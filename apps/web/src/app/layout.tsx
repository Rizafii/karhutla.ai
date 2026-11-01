import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "KARHUTLA.AI — Jaga Hutan Bersama",
  description:
    "Pemantauan kebakaran hutan, verifikasi operator, dan koordinasi penanganan.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
