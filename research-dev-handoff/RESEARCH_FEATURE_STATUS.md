# Status Fitur Aplikasi untuk Penelitian

| Fitur | Status Teknis | Catatan |
|---|---|---|
| Login Siswa | **SELESAI** | Menggunakan kredensial murni (NISN). |
| Dashboard Siswa | **FOUNDATION ONLY** | Tampilan *UI basic* ada, butuh perapian tata letak (Jalur 2). |
| Modul Materi (Bacaan) | **FOUNDATION ONLY** | Tabel ada, integrasi ada, namun isi materinya (*content/video*) kosong/dummy (Jalur 2). |
| Bank Soal (Admin CSV) | **SELESAI** | *Parser* dan *Database* kokoh 100%. |
| Mode Pretest & Posttest | **SELESAI** | Steril, mem-filter soal sesuai properti `mode` (Jalur 1). |
| Autosave Uraian (Tes) | **SELESAI** | *Debounce* & perlindungan dari *tab-close* / *refresh*. |
| Timer 60 Menit (Server-Based) | **SELESAI** | *No-cheat*, menghitung absolut dari *database* `startedAt`. |
| Mode Practice (Latihan) | **SELESAI DGN CATATAN** | Algoritma *backend* selesai mutlak. Namun *UI React*-nya masih polos (belum merender aset animasi lantai/robot). |
| Hint 1 & Hint 2 | **SELESAI** | *Triggered* setelah salah 1x dan 2x di *Practice*. |
| Trigger Remedial (Salah 3x) | **SELESAI** | Status sesi *backend* berubah menjadi `REMEDIAL_REQUIRED` agar progres lantai latihan ditahan dengan aman. |
| Progress & Gamifikasi | **BELUM** | Papan Skor, pergeseran poin, & animasi level up (Fokus Jalur 2). |
| Ekspor CSV Data Penelitian | **SELESAI** | Terpisah antara `/export/research` (Tes) dan `/export/practice` (Latihan). |
| Essay Review / Koreksi | **FOUNDATION ONLY** | URL Endpoint `/api/admin/essays` JSON siap ditarik, UI Admin-nya belum ada (Jalur 2). |
| Role Protection | **SELESAI** | Siswa terblokir masuk panel Admin, dan sebaliknya. |
