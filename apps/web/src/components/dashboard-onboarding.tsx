"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Check, Eye, Play, ScanLine, ShieldCheck, Users, FileText, X, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import styles from "./dashboard-onboarding.module.css";

const steps = [
  { icon: Eye, label: "Kenali ruang kerja", title: "Selamat datang di ruang kendali.", description: "Ikuti panduan singkat ini untuk memahami alur pemantauan sampai laporan kejadian.", route: "OVERVIEW", items: ["Empat tayangan kawasan", "Antrean indikasi", "Kesiapan regu & drone"], tip: "Mulai sebagai Operator. Overview merangkum pantauan, kejadian, cuaca, dan bantuan yang tersedia." },
  { icon: Play, label: "Mulai pemantauan", title: "Mulai dari menu Demo.", description: "Buka menu Demo di bagian atas, lalu pilih Mulai pemantauan setelah model dan video siap.", route: "DEMO > MULAI PEMANTAUAN", items: ["Periksa kesiapan AI", "Mulai pemantauan", "Tunggu indikasi"], tip: "Jika AI belum siap, lihat Pengaturan. Untuk mencoba alur tanpa menunggu deteksi, pilih Mulai simulasi manual, lalu Buat kejadian manual di menu Demo." },
  { icon: ScanLine, label: "Periksa bukti", title: "Buka indikasi, periksa gambarnya.", description: "Pilih kejadian dari antrean atau ikon lonceng. Periksa bukti visual serta sumber kejadian sebelum menentukan langkah berikutnya.", route: "KEJADIAN > PERIKSA", items: ["Lihat gambar bukti", "Lanjutkan penanganan", "Atau: Bukan kebakaran"], tip: "Gambar bukti akan mencoba dimuat ulang jika koneksi terganggu. Kejadian manual tidak memiliki gambar hasil deteksi AI." },
  { icon: ShieldCheck, label: "Pilih bantuan", title: "Tentukan tindak lanjutnya.", description: "Setelah pemeriksaan, pilih Pindai area saja atau Pindai & lepaskan air, lalu Setujui & kirim drone. Bantuan darat tersedia lewat Tangani dengan regu.", route: "BANTUAN > PENANGANAN", items: ["Pilih tugas", "Setujui bantuan", "Ikuti progres"], tip: "Drone dan regu memiliki penugasan terpisah. Selesainya misi tidak otomatis menutup kejadian; hasilnya tetap perlu diperiksa operator." },
  { icon: Users, label: "Ikuti penanganan", title: "Lihat dari peran yang tepat.", description: "Buka menu peran di kanan atas untuk beralih antara Operator, Petugas Damkar, dan Pantauan Drone.", route: "MENU PERAN / KANAN ATAS", items: ["Operator: koordinasi", "Petugas: perbarui tugas", "Drone: HUD & progres"], tip: "Petugas mengikuti urutan Terima tugas, Berangkat ke lokasi, Saya sudah tiba, lalu Selesaikan tugas regu. Dari Pantauan Drone, gunakan Kembali ke penanganan untuk membuka kejadian terkait." },
  { icon: FileText, label: "Simpan hasil", title: "Selesaikan dengan catatan yang utuh.", description: "Setelah hasil penanganan diperiksa, pilih Tandai teratasi lalu Tutup kejadian. Buka Riwayat kejadian untuk melihat laporannya.", route: "RIWAYAT KEJADIAN > LAPORAN", items: ["Tandai teratasi", "Tutup kejadian", "Cetak atau unduh laporan"], tip: "Cetak laporan dapat menyimpan PDF melalui browser. Unduhan JSON tersedia di Ekspor lainnya. Simpan laporan sebelum menggunakan Reset atau Ulangi pemantauan." },
];

export function DashboardOnboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (open) setStep(0); }, [open]);
  useEffect(() => { if (open) heading.current?.focus(); }, [step, open]);
  const current = steps[step];
  const Icon = current.icon;
  const last = step === steps.length - 1;
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className={styles.overlay} />
    <Dialog.Content className={styles.dialog} aria-describedby="onboarding-description">
      <aside className={styles.rail}><span className={styles.brand}>karhutla.ai <span>/ PANDUAN</span></span><h2>Kenali alurnya.<br /><span>Siap mengambil langkah.</span></h2><nav aria-label="Langkah tutorial">{steps.map((item, index) => <button key={item.label} onClick={() => setStep(index)} className={index === step ? styles.active : ""} aria-current={index === step ? "step" : undefined}><span>{index < step ? <Check size={13} aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span>{item.label}</button>)}</nav><p>Panduan bisa dibuka lagi lewat ikon bantuan atau menu peran.</p></aside>
      <div className={styles.body}>
        <div className={styles.top}><span>PANDUAN PENGGUNAAN <b>{step + 1} / {steps.length}</b></span><Dialog.Close asChild><button className={styles.close} aria-label="Tutup panduan"><X size={19} /></button></Dialog.Close></div>
        <div className={styles.content}><div className={styles.icon}><Icon size={27} strokeWidth={1.6} aria-hidden="true" /></div><Dialog.Title ref={heading} tabIndex={-1} className={styles.title}>{current.title}</Dialog.Title><Dialog.Description id="onboarding-description" className={styles.description}>{current.description}</Dialog.Description>
          <div className={styles.preview}><span>{current.route}</span><ol>{current.items.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></div><p className={styles.tip}>{current.tip}</p>
          {step === 0 && <p className={styles.audioNote}><Volume2 size={16} aria-hidden="true" />Alarm suara aktif secara default. Tombol speaker di dashboard dapat menyenyapkannya.</p>}
        </div>
        <div className={styles.actions}><button className={styles.skip} onClick={onClose}>Lewati panduan</button><div><Button variant="outline" disabled={step === 0} onClick={() => setStep(value => value - 1)}><ArrowLeft size={15} />Kembali</Button><Button onClick={() => last ? onClose() : setStep(value => value + 1)}>{last ? "Mulai menjelajah" : "Berikutnya"}<ArrowRight size={15} /></Button></div></div>
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
