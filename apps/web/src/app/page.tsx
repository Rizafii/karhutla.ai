import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
export const metadata: Metadata = {
  title: "KARHUTLA.AI — Deteksi lebih awal. Jaga hutan bersama.",
  description: "Kenali sistem pemantauan asap dan api, verifikasi operator, serta koordinasi penanganan kebakaran hutan dan lahan dalam satu ruang.",
};
export default function Page() {
  return <LandingPage />;
}
