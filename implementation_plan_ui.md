# Rencana Implementasi: Frontend UI Mode Tes (Strict Mode)

Dokumen ini merangkum rencana pembuatan *user interface* (UI) khusus untuk **Mode Tes Penelitian**, memastikan lingkungan tes yang bersih, fokus, dan steril dari gamifikasi.

## ⚠️ User Review Required
Silakan tinjau struktur *route* dan desain komponen di bawah ini. Pastikan *flow* ini sesuai dengan ekspektasi Anda untuk pengambilan data penelitian skripsi.

## 1. Struktur Route Baru
- **URL**: `/student/test/[materialId]?type=PRETEST` (atau `POSTTEST`).
- **File**: 
  - `[NEW]` `apps/web/src/app/student/test/[materialId]/page.tsx` (Server Component, memvalidasi parameter).
  - `[NEW]` `apps/web/src/app/student/test/[materialId]/StrictTestClient.tsx` (Client Component, menangani interaksi tes murni).

## 2. Desain UI "Strict Mode"
Berbeda dengan halaman Latihan (`/student/practice/...`), halaman tes ini akan memiliki karakteristik:
- **Tema**: Tetap menggunakan *Glassmorphism* (agar senada dengan aplikasi), namun desain difokuskan pada konten (bersih, minimalis).
- **Komponen yang Dihilangkan**: Animasi robot naik gedung, poin/koin, *streak bar*, tombol *hint*, ikon *confetti*, dan indikator benar/salah.
- **Header**: Menampilkan "Pretest / Posttest - [Judul Materi]" dan Indikator Soal (misal: "Soal 3 dari 10").
- **Navigasi Soal**: Terdapat grid nomor soal (1, 2, 3...) di sebelah sisi/bawah agar siswa bisa melompat ke soal lain, serta tombol "Sebelumnya" dan "Selanjutnya". Nomor soal yang sudah dijawab akan diberi warna berbeda.

## 3. Penanganan Tipe Soal
- **Pilihan Ganda (PG)**: Menampilkan 4 tombol besar (A, B, C, D). Jika dipilih, tombol akan berstatus *selected*, jawaban langsung dikirim ke `POST /api/test/answer` di *background* secara *silent*, tanpa mengubah warna menjadi hijau/merah.
- **Uraian (Essay)**: Menampilkan kotak teks (`<textarea>`). Jawaban akan dikirim/di-simpan ke *backend* saat *textarea* kehilangan fokus (*onBlur*) atau setelah siswa berhenti mengetik (*debounce* 1 detik) agar data tidak hilang.

## 4. Flow Selesai Tes
- Tombol **"Selesai Tes"** akan muncul atau selalu ada di akhir soal.
- Saat diklik, akan muncul *Modal Konfirmasi* ("Apakah Anda yakin? Jawaban tidak dapat diubah lagi.").
- Jika dikonfirmasi, sistem memanggil `POST /api/test/finish`, lalu melempar (*redirect*) siswa kembali ke Dasbor dengan pesan sukses.

## 5. Proteksi
- Jika siswa yang sama mencoba membuka URL tes ini lagi setelah `completedAt` terisi di *backend*, halaman akan memblokir dan menampilkan layar "Anda sudah menyelesaikan tes ini" dengan tombol kembali ke Dasbor.

---

## Open Questions (Opsional untuk Anda)
1. Apakah tes dibatasi waktu mundur (misal 60 menit), atau bebas selama belum klik selesai? *(Untuk MVP ini, saya asumsikan **tidak ada** timer mundur yang memutus paksa kecuali Anda memintanya).*
2. Apakah *route* `/student/test/[materialId]?type=PRETEST` sudah cukup nyaman?

Jika rencana ini sudah tepat, saya akan segera membangun komponen *Frontend* ini!
