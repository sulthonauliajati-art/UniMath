# Alur UI/UX Frontend (Flow Ringkas)

Dokumen ini mendeskripsikan *user journey* (perjalanan pengguna) yang murni dikontrol oleh *Client Components* di Next.js.

### 1. Flow Siswa Login & Dasbor
Siswa masuk via `/student/login` menggunakan kredensial (NISN/Password) $\rightarrow$ diarahkan ke `/student/dashboard`. Dasbor menyajikan menu Materi (untuk mengakses Pretest/Posttest) dan menu Latihan.

### 2. Flow Practice (Adaptive Gamified)
Siswa menekan tombol "Main" $\rightarrow$ URL menuju `/student/practice/[id]/play` $\rightarrow$ merender robot di depan gedung.
- **Jika Jawaban Benar**: Robot naik 1 lantai, *Confetti* muncul, soal berikutnya di-*fetch* (menjadi lebih sulit jika `difficulty` sebelumnya Medium).
- **Jika Jawaban Salah (1x)**: Gedung bergetar. Muncul **Hint 1** (Teks bantuan level 1). Siswa tidak berpindah soal.
- **Jika Jawaban Salah (2x)**: Muncul **Hint 2** (Teks bantuan level 2).
- **Jika Jawaban Salah (3x)**: Muncul *Modal Remedial* ("Ayo pahami materi lagi..."). Sesi berubah status menjadi `REMEDIAL_REQUIRED`. Siswa diarahkan ke `/student/materials/[id]`.

### 3. Flow Pasca-Remedial
Siswa kembali mengeklik "Main" pada materi yang sama $\rightarrow$ URL `/student/practice/[id]/play` dipanggil $\rightarrow$ *Backend* menyadari ada sesi yang berstatus `REMEDIAL_REQUIRED`. Sesi tersebut di-*resume*, siswa melanjutkan persis dari soal dan lantai tempat dia "terjebak" sebelumnya.

### 4. Flow Test (Strict Pretest / Posttest)
Siswa mengakses `/student/test/[materialId]/PRETEST` $\rightarrow$ Halaman `StrictTestClient` dirender (polos, gelap, minimalis).
- **Timer**: 60:00 (menit) terus berjalan di *Header*, dihitung dari waktu server. Akan berkedip merah saat sisa $\le$ 1 menit.
- **Autosave**: Ketikan pada kanvas Uraian otomatis dikirim ke server setelah siswa berhenti mengetik selama 1 detik (*debounce*), atau saat siswa mengeklik tombol nomor navigasi di samping kanan. Ada tulisan "Menyimpan..." dan "Tersimpan ✓" di atap *Header*.
- **Selesai Tes**: Jika siswa mengeklik "Akhiri Ujian" (dan mengonfirmasi *prompt*) atau jika waktu habis $\rightarrow$ jawaban terakhir di-*flush*, sistem memanggil *finish*, dan siswa dilempar kembali ke Dasbor. Halaman tidak bisa diakses ulang.

### 5. Flow Admin (Bank Soal)
Admin *login* $\rightarrow$ menuju `/admin/questions` $\rightarrow$ mengunggah *file* CSV 15 Kolom $\rightarrow$ UI menunggu respons dari *backend* $\rightarrow$ menampilkan pesan sukses (angka *rows* masuk) atau *alert* merah jika format *template* dilanggar.
