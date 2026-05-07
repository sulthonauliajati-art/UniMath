# Rencana Implementasi: Penutupan Total Jalur 1 (Hardening & QA)

Dokumen ini adalah cetak biru eksekusi akhir untuk mengunci, mengamankan, dan menyelesaikan semua fondasi *backend* (Jalur 1) agar 100% siap digunakan untuk penelitian.

## ⚠️ User Review Required
Silakan tinjau rencana *hardening* di bawah ini. Pastikan perbaikan aturan *adaptive difficulty* dan format ekspor CSV sudah sesuai dengan kebutuhan Bab 3/Bab 4 skripsi Anda.

---

## 1. Hardening Timer Tes (Server-Source of Truth)
- **API `start`**: `/api/test/start` akan mengembalikan nilai `startedAt` (waktu server) ke frontend.
- **Frontend Timer**: Kalkulasi waktu di `StrictTestClient.tsx` tidak lagi menghitung 60 menit dari nol saat *refresh*, melainkan menghitung: `60 menit - (waktu_sekarang - startedAt)`.
- **Auto-lock**: Jika sisa waktu $\le 0$, sesi langsung dikunci secara otomatis.

## 2. Hardening Autosave & Flush
- Penambahan fungsi pelindung pada *event* `beforeunload` (mencegah tab ditutup paksa saat sedang "Menyimpan...").
- *Refactor* mekanisme *debounce* agar memastikan sinkronisasi sempurna, terutama pada kondisi koneksi internet lambat (mencegah *race condition*).

## 3. CSV Pipeline Final
- Memperkuat *parser* di `/api/admin/questions/upload/route.ts`.
- Jika ada *row* yang memiliki `mode`, `indicator`, atau `questionType` di luar nilai *enum* yang diizinkan, *backend* akan memberikan daftar *error* spesifik (misal: "Baris 5: Indikator harus I1-I4").

## 4. Practice Engine Hardening (Revisi Rule Remedial)
Sesuai instruksi Anda, aturan adaptif di `/api/practice/answer` akan dikoreksi:
- Salah 1x $\rightarrow$ Tampilkan Hint 1
- Salah 2x $\rightarrow$ Tampilkan Hint 2
- Salah 3x $\rightarrow$ Langsung **Trigger Remedial** (ubah `status` sesi menjadi `ABANDONED` dan suruh siswa membaca materi).
- **Metadata**: Menyisipkan parameter `usedHintLevel` (dari *wrong count*) ke dalam `practice_attempts` setiap kali siswa akhirnya menjawab benar.

## 5. Export Data Penelitian (New Endpoints)
Saya akan membuat 2 rute khusus untuk mengunduh data langsung ke CSV (bisa dipanggil via URL *browser* oleh Admin):
1. **`/api/admin/export/research?type=PRETEST`**:
   - Kolom: `Nama Siswa`, `NISN`, `Materi`, `Tipe Tes`, `ID Soal`, `Indikator`, `Jawaban`, `Is Correct`, `Durasi (ms)`, `Waktu Submit`.
2. **`/api/admin/export/practice`**:
   - Kolom: `Nama Siswa`, `Materi`, `Lantai`, `ID Soal`, `Indikator`, `Difficulty`, `Used Hint Level`, `Is Correct`, `Waktu Submit`.

## 6. Essay Review Foundation (New Endpoint)
- **`/api/admin/essays`**: Endpoint ringan untuk menarik seluruh jawaban tes yang memiliki `questionType === 'URAIAN'` yang masih berstatus `isCorrect: null`, agar Anda bisa mengoreksinya di luar sistem atau melalui modul *admin* sederhana di Jalur 2 nanti.

---

## Open Questions (Opsional)
1. Terkait **Practice Engine**, jika siswa sudah disuruh remedial (Salah 3x), apakah siswa akan memulai sesi latihan baru dari "Lantai 1", atau dia melanjutkan sesi yang lama? (Saat ini kode Anda meng-set status sesi menjadi `ABANDONED`, yang berarti dia akan mulai sesi/lantai baru setelah selesai baca materi). Saya asumsikan *Mulai Sesi Baru* adalah standar yang aman.

Jika Anda menyetujui cetak biru penutupan ini, saya akan langsung mengeksekusi ke-6 area ini sekaligus dan memberikan laporan final!
