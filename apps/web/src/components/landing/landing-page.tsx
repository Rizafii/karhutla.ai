import Image from "next/image";
import Link from "next/link";
import { LandingExperience, LandingMenu, ForestFilm } from "./landing-experience";
import styles from "./landing.module.css";

const stages = [
  { title: "Pantau.", text: "Amati kondisi hutan dari beberapa titik kamera. Deteksi AI membantu menandai indikasi asap dan api untuk diperiksa.", label: "01 / OBSERVASI", detail: "Kamera · Indikasi asap & api" },
  { title: "Verifikasi.", text: "Lihat bukti visual, periksa lokasi perkiraan, lalu tentukan tindak lanjut. Keputusan tetap berada di tangan operator.", label: "02 / PEMERIKSAAN", detail: "Bukti visual · Pemeriksaan operator" },
  { title: "Koordinasikan.", text: "Hubungkan keputusan dengan penugasan regu dan pemantauan drone. Ikuti perkembangan penanganan dalam satu alur.", label: "03 / PENANGANAN", detail: "Penugasan regu · Misi drone virtual" },
  { title: "Evaluasi.", text: "Telusuri kembali kejadian, tindakan, dan hasil penanganan. Setiap langkah tersimpan agar mudah ditinjau.", label: "04 / RIWAYAT", detail: "Catatan aktivitas · Laporan kejadian" },
];

export function LandingPage() {
  return <div id="beranda" className={styles.landing}>
    <a className={styles.skip} href="#tentang">Lewati intro</a>
    <header className={styles.nav}>
      <Link href="/" className={styles.brand} aria-label="KARHUTLA.AI, beranda"><Image src="/logo.svg" alt="" width={30} height={34} priority /><span>karhutla<span className={styles.brandSuffix}>.ai</span></span></Link>
      <span className={styles.navDescriptor}>Forest intelligence system</span>
      <span className={styles.navStatus}><i /> Jaga hutan bersama</span>
      <Link href="/dashboard" className={styles.navCta}>Buka Dashboard <span aria-hidden="true">↗</span></Link>
      <LandingMenu />
    </header>
    <main>
      <LandingExperience />
      <section className={styles.hero} aria-labelledby="landing-title" data-drone="hero">
        <div className={styles.heroField}>
          <span className={styles.wordmark} aria-hidden="true">karhutla<span>.ai</span></span>
          <div className={styles.heroCoordinates}><span>PEMANTAUAN HUTAN & LAHAN</span><span>INDONESIA / 01</span></div>
          <div className={styles.heroModelLabel}><span className={styles.cross}>+</span><span>PERSPEKTIF BARU<br />UNTUK HUTAN KITA</span></div>
          <div className={styles.heroBottom}><span>AMATI. PAHAMI. TINDAK LANJUTI.</span><span>↓</span></div>
        </div>
        <div className={styles.heroCaption}><h1 id="landing-title">Deteksi lebih awal.<br /><span>Jaga hutan bersama.</span></h1><p>Pemantauan asap dan api, verifikasi operator,<br className={styles.desktopBreak} /> dan koordinasi penanganan dalam satu ruang.</p><a href="#tentang">Jelajahi sistem <span aria-hidden="true">↓</span></a></div>
      </section>

      <section id="tentang" className={styles.intro} data-drone="intro">
        <div className={styles.sectionLabel}><span>[ 01 — MISI KAMI ]</span><span>Setiap indikasi berarti.</span></div>
        <div className={styles.introLayout}><h2>Hutan tidak<br />bisa menunggu.<br /><span>Kita bisa lebih<br />peka.</span></h2><div className={styles.introFoot}><span className={styles.cross}>+</span><p>Dari indikasi pertama hingga tindak lanjut. KARHUTLA.AI membantu operator melihat perubahan, memeriksa bukti, dan mengoordinasikan penanganan.</p></div></div>
        <div className={styles.introNote}>TEKNOLOGI MEMBANTU MENGAMATI.<br />MANUSIA TETAP MEMEGANG KEPUTUSAN.</div>
      </section>

      <section id="pemantauan" className={styles.monitoring}>
        <div className={styles.sectionLabel}><span>[ 02 — PEMANTAUAN ]</span><span>Dari hutan, menjadi informasi.</span></div>
        <div className={styles.sectionHeading}><h2>Lihat lebih jauh.<br /><span>Pahami lebih awal.</span></h2><p>Satukan pantauan kamera dengan indikasi AI.<br />Temukan apa yang perlu diperiksa, tanpa<br className={styles.desktopBreak} /> kehilangan konteks di lapangan.</p></div>
        <div className={styles.forestFrame}>
          <ForestFilm />
          <div className={styles.filmTop}><span><i /> PANTAUAN KAWASAN</span><span>VISUALISASI SISTEM</span></div>
          <div className={styles.reticle}><span>AREA PENGAMATAN</span><i /><b>+</b></div>
          <div className={styles.filmBottom}><p>Perspektif yang lebih luas.<br /><span>Perhatian pada setiap perubahan.</span></p><span>01 / FOREST VIEW</span></div>
        </div>
        <div className={styles.capabilities}>
          <div><span>01 / AMATI</span><h3>Pantauan kamera</h3><p>Beberapa sudut pandang dalam satu tampilan untuk memahami kondisi kawasan.</p></div>
          <div><span>02 / KENALI</span><h3>Indikasi asap & api</h3><p>AI menandai kandidat kejadian dan menyimpan bukti visual untuk pemeriksaan.</p></div>
          <div><span>03 / PASTIKAN</span><h3>Verifikasi operator</h3><p>Periksa indikasi sebelum memutuskan langkah penanganan berikutnya.</p></div>
        </div>
      </section>

      <section id="alur" className={styles.workflow}>
        <div className={styles.sectionLabel}><span>[ 03 — ALUR KERJA ]</span><span>Terhubung dari awal hingga akhir.</span></div>
        <div className={styles.workflowHeading}><h2>Satu alur.<br /><span>Setiap langkah berarti.</span></h2><p>Informasi yang jelas.<br />Tindak lanjut yang terarah.</p></div>
        <div className={styles.workflowBody}>
          <div className={styles.workflowRail}><span>KOORDINASI DARI SATU RUANG</span><div className={styles.orbit} /><span className={styles.workflowCaveat}>Operasi drone dan regu pada sistem ini<br />merupakan simulasi.</span></div>
          <div className={styles.steps}>{stages.map((stage, index) => <article key={stage.title} className={styles.step} data-drone={`step-${index}`}><span className={styles.stepLabel}>{stage.label}</span><h3>{stage.title}</h3><p>{stage.text}</p><span className={styles.stepDetail}>{stage.detail}</span></article>)}</div>
        </div>
      </section>

      <section id="platform" className={styles.platform}>
        <div className={styles.sectionLabel}><span>[ 04 — PLATFORM ]</span><span>Konteks lengkap. Keputusan lebih terarah.</span></div>
        <div className={styles.sectionHeading}><h2>Seluruh pantauan.<br /><span>Satu ruang kendali.</span></h2><Link className={styles.textLink} href="/dashboard">Jelajahi Dashboard <span aria-hidden="true">↗</span></Link></div>
        <div className={styles.dashboardFrame}><div className={styles.browserBar}><span><i /><i /><i /></span><span>KARHUTLA.AI / OVERVIEW</span><span>↗</span></div><Image src="/landing/dashboard.webp" alt="Dashboard KARHUTLA.AI dengan pantauan kamera, antrean verifikasi, temperatur area, dan prakiraan cuaca" width={1440} height={1320} sizes="(max-width: 700px) 90vw, 80vw" className={styles.dashboardImage} /></div>
        <div className={styles.platformDetails}><p><span>01</span>Pantauan & kejadian</p><p><span>02</span>Cuaca & temperatur area</p><p><span>03</span>Indeks potensi kebakaran</p></div>
        <p className={styles.platformNote}>Indeks potensi kebakaran merupakan indikator eksperimental berbasis kondisi cuaca, bukan probabilitas kebakaran yang tervalidasi.</p>
      </section>

      <section className={styles.closing}>
        <div className={styles.sectionLabel}><span>[ JAGA HUTAN BERSAMA ]</span><span>Mulai dari perhatian.</span></div>
        <h2>Satu ruang untuk<br />memantau dan<br /><span>berkoordinasi.</span></h2>
        <Link href="/dashboard" className={styles.closingCta}>Buka Dashboard <span aria-hidden="true">↗</span></Link>
        <div className={styles.closingMark} aria-hidden="true">karhutla.ai</div>
      </section>
    </main>
    <footer className={styles.footer}><Link href="/" className={styles.footerBrand}>karhutla.ai</Link><span>Teknologi untuk hutan yang tetap hidup.</span><a href="#beranda">Kembali ke atas ↑</a></footer>
  </div>;
}
