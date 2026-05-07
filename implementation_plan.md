# Rencana Implementasi: Tahap 1 - Finalisasi Database Schema

Rencana ini akan berfokus **sepenuhnya** pada pembaruan arsitektur *database* di file `d:\UniMath\apps\web\src\lib\db\schema.ts`. Pembaruan ini akan memastikan struktur data siap untuk kebutuhan penelitian skripsi S1 Anda.

## ⚠️ User Review Required
Penting: Perubahan nama tabel dari `attempts` menjadi `practice_attempts` akan menyebabkan *error* pada beberapa rute API (seperti `/api/practice/answer` dan `/api/practice/current`). Rencana ini juga mencakup perbaikan *import* dan referensi pada file-file tersebut agar sistem tetap berjalan setelah skema diubah. Silakan tinjau struktur kolom baru di bawah ini.

## Proposed Changes

---

### [MODIFY] `d:\UniMath\apps\web\src\lib\db\schema.ts`

Saya akan memperbarui skema Drizzle ORM dengan perubahan berikut:

#### 1. Modifikasi Tabel `questions`
Menambahkan metadata wajib untuk skripsi:
- `indicator`: Enum `['I1', 'I2', 'I3', 'I4']` (Default 'I1').
- `mode`: Enum `['PRACTICE', 'PRETEST', 'POSTTEST', 'ALL']` (Default 'ALL').
- `remedialMaterialId`: Teks opsional (link ke material/ringkasan spesifik).
*(Catatan: `hint1`, `hint2`, `hint3`, `explanation`, dan `difficulty` sudah ada).*

#### 2. Modifikasi Tabel `practice_sessions`
Menambahkan pelacakan *adaptive difficulty*:
- `currentStreak`: Integer (Default 0). Akan digunakan untuk logika naik/turun level.

#### 3. Rename & Modifikasi Tabel `attempts` -> `practice_attempts`
Mengganti nama tabel dan ekspor Drizzle agar konsisten, serta menambahkan:
- `usedHintLevel`: Integer (Default 0). Melacak apakah siswa memakai hint.
- `isRemedialSession`: Boolean (Default false).

#### 4. Pembuatan Tabel Baru `test_sessions`
- `id`: Teks (Primary Key).
- `studentUserId`: Referensi ke `users.id`.
- `testType`: Enum `['PRETEST', 'POSTTEST']`.
- `startedAt`: Waktu mulai.
- `completedAt`: Waktu selesai (opsional/null jika belum selesai).

#### 5. Pembuatan Tabel Baru `test_attempts`
- `id`: Teks (Primary Key).
- `sessionId`: Referensi ke `test_sessions.id`.
- `questionId`: Referensi ke `questions.id`.
- `answer`: Enum `['A', 'B', 'C', 'D']`.
- `isCorrect`: Boolean.
- `responseMs`: Integer (opsional, untuk pelacakan waktu jawab).
- `createdAt`: Timestamp.

---

### Pembaruan Rute Backend Terdampak
Karena kita mengubah nama ekspor `attempts` menjadi `practiceAttempts`, saya akan langsung memperbaiki *import* di file berikut agar aplikasi tidak *error*:
- `apps/web/src/app/api/practice/answer/route.ts`
- `apps/web/src/app/api/practice/current/route.ts`
- `apps/web/src/app/api/practice/start/route.ts`

## Verification Plan

### Automated / Manual Verification
1. Menjalankan perintah `pnpm db:generate` atau `pnpm drizzle-kit push` (jika tersedia) untuk memastikan skema berhasil divalidasi dan dikirim ke database SQLite/Turso.
2. Memastikan seluruh aplikasi Next.js berhasil di-*build* ulang tanpa ada *TypeScript error* yang disebabkan oleh perubahan skema.
3. Membuka Drizzle Studio (jika di-setup) untuk memastikan tabel `test_sessions` dan kolom metadata di `questions` telah muncul.
