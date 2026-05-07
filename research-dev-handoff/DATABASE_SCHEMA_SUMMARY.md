# Ringkasan Database Schema (Penelitian)

Berikut adalah entitas utama di *database* SQLite (Drizzle ORM) yang krusial untuk skripsi:

### 1. `questions`
- **Fungsi**: Menyimpan bank soal.
- **Field Penting**: `mode` (ALL/PRETEST/PRACTICE), `indicator` (I1-I4), `questionType` (PG/URAIAN), `difficulty` (1-3), `correct`, `hint1`, `hint2`, `hint3`, `remedialMaterialId`.

### 2. `users` & `classes` / `class_students`
- **Fungsi**: Identitas subjek penelitian.
- **Field Penting**: `role` (STUDENT/TEACHER/ADMIN), `nisn`, `name`. Relasi kelas menentukan *grouping* siswa saat ekspor data guru.

### 3. `test_sessions`
- **Fungsi**: Merekam waktu masuk dan selesainya tes penelitian.
- **Field Penting**: `materialId`, `testType` (PRETEST/POSTTEST), `startedAt`, `completedAt`.

### 4. `test_attempts`
- **Fungsi**: Merekam per-jawaban siswa saat tes.
- **Field Penting**: `questionId`, `answer` (Teks bebas untuk mengakomodasi Uraian), `isCorrect` (Nullable, untuk Uraian nilainya `null`), `responseMs`.

### 5. `practice_sessions`
- **Fungsi**: Menyimpan progres latihan adaptif.
- **Field Penting**: `floor`, `wrongCount`, `currentStreak`, `status` (ACTIVE/COMPLETED/ABANDONED/REMEDIAL_REQUIRED).

### 6. `practice_attempts`
- **Fungsi**: Merekam per-jawaban siswa saat latihan.
- **Field Penting**: `isCorrect`, `usedHintLevel` (0 = no hint, 1 = h1, 2 = h2), `isRemedialSession`.

### Endpoint / Ekspor Pendukung
- `/api/admin/export/research`: Mengekspor join dari `users` + `test_sessions` + `test_attempts` + `questions` ke CSV.
- `/api/admin/essays`: Menarik record `test_attempts` bertipe URAIAN yang belum terkoreksi (`isCorrect: null`).
