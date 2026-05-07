# Spesifikasi Bank Soal (CSV Format V2)

Agar *backend* dapat menyerap soal dan memisahkan logika Latihan vs Ujian Penelitian, pengunggahan dilakukan menggunakan *template* CSV dengan 15 kolom urut.

## Struktur Kolom Final

1. **`mode`** (Wajib)
   - Enum: `PRACTICE`, `PRETEST`, `POSTTEST`, `ALL`
   - Fungsi: Mengatur soal ini hanya muncul di lingkungan mana.
2. **`indicator`** (Wajib)
   - Enum: `I1`, `I2`, `I3`, `I4`
   - Fungsi: Parameter spesifik penelitian (misal: Kemampuan Komunikasi Matematis, dsb).
3. **`difficulty`** (Wajib)
   - Tipe: Angka (1, 2, 3) $\rightarrow$ 1=Mudah, 2=Sedang, 3=Sulit.
   - Fungsi: Menentukan pijakan *Adaptive Difficulty* di mode Latihan.
4. **`question_type`** (Wajib)
   - Enum: `PG`, `URAIAN`
   - Fungsi: Menentukan apakah *frontend* me-render tombol A/B/C/D atau *text-area* bebas.
5. **`question`** (Wajib)
   - Tipe: Teks
   - Fungsi: Batang tubuh soal (stem).
6. **`opt_a`** (Wajib untuk PG)
   - Opsi jawaban A. Kosongkan jika soal URAIAN.
7. **`opt_b`** (Wajib untuk PG)
   - Opsi jawaban B. Kosongkan jika soal URAIAN.
8. **`opt_c`** (Wajib untuk PG)
   - Opsi jawaban C. Kosongkan jika soal URAIAN.
9. **`opt_d`** (Wajib untuk PG)
   - Opsi jawaban D. Kosongkan jika soal URAIAN.
10. **`correct`** (Wajib untuk PG)
    - Enum: `A`, `B`, `C`, `D`
    - Kunci jawaban yang digunakan untuk mengkalkulasi `isCorrect` oleh server.
11. **`hint1`** (Opsional, sangat disarankan untuk `mode: PRACTICE`)
    - Teks petunjuk tingkat pertama (muncul jika salah 1x).
12. **`hint2`** (Opsional)
    - Teks petunjuk tingkat kedua (muncul jika salah 2x).
13. **`hint3`** (Opsional)
    - Teks petunjuk tingkat ketiga (cadangan).
14. **`explanation`** (Opsional)
    - Penjelasan / Pembahasan utuh dari soal tersebut (ditampilkan saat *review* atau mode khusus).
15. **`remedial_material_id`** (Opsional)
    - Jika siswa gagal (salah 3x) pada soal ini, ID materi apa yang harus mereka baca. Kosong = gunakan materi *default* dari sesi saat itu.
