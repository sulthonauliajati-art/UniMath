# Ringkasan Arsitektur Final (UniMath V2)

Aplikasi dibangun menggunakan **Next.js 14 (App Router)**, **Drizzle ORM**, dan database **Turso (SQLite)**. Arsitektur berorientasi pada keamanan data penelitian (Database-First).

## 1. Route Utama Frontend
- `/student/dashboard`: Halaman utama setelah login.
- `/student/materials`: Akses rangkuman dan video pembelajaran.
- `/student/practice/[materialId]/play`: Lingkungan Latihan (Gamifikasi & Adaptif).
- `/student/test/[materialId]/[testType]`: Lingkungan Tes (Steril & Strict).

## 2. Pemisahan Practice vs Test
- **Practice**: Menggunakan tabel `practice_sessions` dan `practice_attempts`. Mengakomodasi metrik lantai, *wrong count*, dan kalkulasi adaptif.
- **Test**: Menggunakan tabel `test_sessions` dan `test_attempts`. Metrik difokuskan pada waktu pengerjaan (`startedAt`, `completedAt`) dan merekam jawaban murni (`responseMs`, `answer` berupa teks bebas).

## 3. Alur Tes (Strict Mode)
1. Siswa masuk via URL `/student/test/M1/PRETEST`.
2. Sistem mengecek *database* apakah sesi sudah ada. Jika ada dan `completedAt` terisi, akses diblokir.
3. Jika waktu berjalan, *timer* menghitung mundur dari `startedAt`.
4. Jawaban (PG/Uraian) otomatis di-*save* ke *backend* tanpa memberikan tahu benar/salah.
5. Saat klik "Selesai" atau Waktu Habis, sesi dikunci mutlak.

## 4. Alur Latihan & Remedial (Adaptive Flow)
1. Siswa menjawab soal. Jika salah:
   - **Salah 1x**: Ditampilkan teks Hint 1.
   - **Salah 2x**: Ditampilkan teks Hint 2.
   - **Salah 3x**: Status sesi berubah menjadi `REMEDIAL_REQUIRED`. Sesi ditahan (tidak naik lantai/tidak gugur total). Siswa disuruh membaca materi kembali.
2. Setelah membaca materi, siswa dapat melanjutkan sesi yang tertahan tadi untuk menyelesaikan lantai tersebut.

## 5. Data Persistence & Export
- Setiap klik/ketikan langsung masuk ke SQLite (tidak mengandalkan `sessionStorage`).
- Ekspor via Admin menghasilkan CSV komprehensif, mencakup Indikator Numerik (I1-I4) dan kolom Tipe Soal.
