# Pemetaan Materi (Materials Map)

Ini adalah struktur konseptual data yang ada pada tabel `materials` yang menjadi jantung aplikasi, menghubungkan antara Latihan, Ujian, dan *Remedial*.

## Field Utama
- **`id`** (contoh: `M1_ARITMATIKA_SOSIAL`)
- **`title`** (contoh: "Aritmatika Sosial: Untung & Rugi")
- **`description`** (Deksripsi ringkas materi)
- **`content`** (Teks HTML / Modul lengkap untuk diakses siswa)
- **`videoUrl`** (Tautan ke referensi visual Youtube, opsional)

## Pemanfaatan dalam Penelitian

### 1. Menautkan Bank Soal
Semua soal (`questions`) memiliki `materialId`. Jika siswa masuk ke rute `/student/practice/M1_ARITMATIKA_SOSIAL/play`, sistem akan mem-*fetch* semua soal dengan ID tersebut.

### 2. Pijakan Sesi Ujian (Pretest / Posttest)
Sesi pretest selalu terpaut dengan ID materi, misalnya untuk memastikan siswa mendapat instrumen yang tepat (`test_sessions.materialId = M1_ARITMATIKA_SOSIAL`).

### 3. Pijakan Bacaan Remedial
Ketika siswa melakukan salah 3x beruntun di soal bernomor ID tertentu, secara *default* sistem menyuruhnya merujuk ulang ke materi utama dari soal tersebut. Namun, jika ada intervensi bahan ajar yang sangat spesifik (misal, materi dasar pembagian), *Admin* dapat mengisi kolom `remedial_material_id` pada CSV khusus soal itu dengan *ID* materi pendukung (contoh: `M0_PEMBAGIAN_DASAR`). Sistem lalu akan menyodorkan materi spesifik tersebut.
