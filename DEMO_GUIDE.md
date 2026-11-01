# Panduan penggunaan Karhutla

Panduan ini mengikuti perombakan UI terbaru. Aplikasi, Docker, build, typecheck, dan test belum dijalankan untuk perubahan ini.

## Persiapan penggunaan

1. Saat siap menjalankan aplikasi, gunakan petunjuk setup di [README.md](README.md). Model dan video perlu tersedia untuk mode AI.
2. Buka http://localhost:3000, lalu pilih **Buka Dashboard**. Akses langsung tersedia di http://localhost:3000/dashboard dan membuka dashboard **Operator**. Gunakan menu peran di navbar untuk beralih ke **Petugas Damkar** atau **Pantauan Drone**.
3. Menu peran di kanan atas menyediakan perpindahan peran dan **Pengaturan**. Kontrol simulasi serta kecepatannya tersedia melalui menu **Demo** di navbar.
4. Suara mati saat aplikasi dibuka. Ikon lonceng dan antrean kejadian tetap menampilkan peringatan. Aktivasi suara membutuhkan klik serta konfirmasi.
5. Video menggunakan rekaman referensi, koordinat merupakan lokasi simulasi, dan regu serta drone bersifat virtual.

## Alur utama

### 1. Pantau

Di **Pantauan**, klik **Mulai pemantauan**. Ganti kamera lewat dropdown dan pilih CAM-002. Tombol **Tanda deteksi AI** membuka anotasi model. Ikon grid membuka **Semua kamera**, sedangkan **Peta** membuka lokasi dan pergerakan virtual.

Tombol mulai hanya menjalankan video. Indikasi dibuat oleh inference model dan validasi berulang; waktu tunggu bergantung CPU. Peringatan baru muncul di sebelah kamera serta pada ikon lonceng.

### 2. Periksa

Klik kejadian dalam antrean. Halaman khusus menampilkan gambar bukti dan langkah **Periksa**.

- Jika perlu ditangani, klik **Lanjutkan penanganan**. Ini menyimpan pemeriksaan operator dan membuka pilihan bantuan.
- Jika bukan kebakaran, pilih **Bukan kebakaran** lalu konfirmasi. Lanjutkan dengan **Tutup kejadian** untuk menyelesaikan pencatatan.

Sumber **Deteksi AI** atau **Simulasi manual** tetap terlihat. Detail, catatan, dan lokasi perkiraan berada di **Detail kejadian & catatan**.

### 3. Pilih bantuan

Pilihan bawaan **Pindai & lepaskan air** menjalankan pemindaian serta pelepasan air virtual. **Pindai area saja** tidak melepas air.

Baca keterangan izin, lalu klik **Setujui & kirim drone**. Persetujuan mengizinkan penerbangan, tugas yang dipilih, dan perjalanan pulang otomatis. Drone tidak menunggu penerimaan tugas regu.

Untuk penanganan darat tanpa drone, pilih **Tangani dengan regu**, pilih regu tersedia, lalu **Tugaskan regu**.

### 4. Ikuti penanganan

Halaman **Penanganan** menunjukkan status ringkas drone dan regu. **Tugaskan regu** dapat dipakai setelah drone berangkat. **Lihat pantauan** membuka video drone; **Kembali ke penanganan** mengembalikan pengguna ke kejadian yang sama.

Di peran **Petugas Damkar**, pilih regu dan ikuti tombol berikutnya: **Terima tugas**, **Berangkat ke lokasi**, **Saya sudah tiba**, lalu **Selesaikan tugas regu**. Peta dan detail tersedia saat dibuka. Status regu juga dapat diperbarui oleh operator.

Di **Pantauan Drone**, video mengikuti perjalanan virtual. Pelepasan air memakai rekaman helikopter referensi, bukan kamera drone nyata. Detail penerbangan, peta, aktivitas, dan sumber video berada di bawah video.

**Kontrol drone** menyediakan pulangkan dan hentikan misi. Misi manual yang sudah ada tetap dapat disetujui, diterbangkan, dan diberi perintah pelepasan air saat di lokasi. Drone yang dihentikan setelah berangkat kembali ke pangkalan sebelum tersedia lagi.

### 5. Selesaikan dan simpan

Setelah hasil penanganan diperiksa, operator memilih **Tandai teratasi**, mengonfirmasi, lalu **Tutup kejadian**. Drone selesai atau air virtual dilepaskan tidak otomatis menandai kebakaran teratasi.

Buka **Lihat laporan** atau tab **Riwayat**. Gunakan **Cetak laporan** untuk cetak/simpan PDF lewat browser. Ekspor JSON tersedia di **Ekspor lainnya**.

Kejadian yang belum ditutup tetap tersedia dalam antrean. Riwayat dapat membuka kembali alur yang belum selesai. Jika masih ada respons setelah kejadian ditutup, kontrolnya tersedia di **Respons yang masih berjalan**.

## Simulasi manual

Jika model atau video belum siap, buka menu peran > **Pengaturan & demo**. Reset bila diperlukan, pilih **Mulai simulasi manual**, lalu **Buat kejadian manual**. Lanjutkan alur Periksa, Bantuan, Penanganan, dan Selesai.

Daftar dan laporan tetap menyatakan **Simulasi manual**. Kejadian manual tidak memiliki bukti deteksi AI.

## Jeda dan pengulangan

- **Jeda/Lanjutkan** di Pantauan mengendalikan waktu simulasi dan video.
- **Pengaturan & demo > Ulangi demo** menghapus data demo dan memulai skenario kembali. Simpan laporan sebelum mengulang atau reset.
- Backend yang restart saat misi aktif menjeda simulasi; lanjutkan dari Operator.
- Setelah koneksi pulih, data kejadian dan laporan dimuat kembali.

Titik awal menggunakan arah kamera dan jarak asumsi 60% jangkauan. Radius dan pemindaian lokasi adalah parameter simulasi, bukan ukuran akurasi. Lokasi manual operator tidak ditimpa pemindaian virtual.

Perintah pemeriksaan untuk penggunaan nanti tersedia di README. Tidak ada pemeriksaan runtime yang dijalankan dalam perombakan UI ini.
