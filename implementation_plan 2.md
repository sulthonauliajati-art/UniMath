# Implementasi Konten Akademik Final ke UniMath

## Deskripsi
Mengimplementasikan 9 materi akademik yang telah di-lock oleh user ke dalam database dan frontend UniMath. Konten mencakup: title, shortDescription, learningObjectives, summaryContent, commonMistakes, remedialText, videoDescription, checkpoint, dll.

## User Review Required

> [!IMPORTANT]
> **Konflik Teknis #1: Schema `materials` saat ini terlalu sederhana**
>
> Tabel `materials` saat ini hanya memiliki: `id`, `title`, `description`, `grade`, `summaryUrl`, `fullUrl`, `videoUrl`, `thumbnailUrl`, `order`, `isActive`, `createdAt`.
>
> Konten Anda membutuhkan **8 field baru** yang belum ada di database:
> - `shortDescription` — deskripsi singkat materi
> - `learningObjectives` — tujuan pembelajaran (JSON array of strings)
> - `summaryContent` — konten ringkasan materi lengkap (teks panjang)
> - `commonMistakes` — kesalahan umum siswa (teks panjang)
> - `remedialText` — teks yang ditampilkan saat siswa masuk mode remedial
> - `videoDescription` — deskripsi konten video (sebagai panduan produksi)
> - `checkpointQuestion` — soal checkpoint (1 soal per materi)
> - `checkpointAnswer` — jawaban checkpoint
>
> **Solusi:** Saya akan menambahkan kolom-kolom ini ke schema Drizzle lalu push ke database.

> [!IMPORTANT]
> **Konflik Teknis #2: Frontend material page saat ini menggunakan iframe Google Drive**
>
> Halaman materi siswa (`/student/materials/[materialId]`) saat ini hanya menampilkan iframe PDF dari Google Drive (`summaryUrl`, `fullUrl`) dan YouTube embed (`videoUrl`).
>
> Konten baru Anda adalah **teks langsung** (`summaryContent`, `remedialText`, dll), bukan link PDF.
>
> **Solusi:** Saya akan mengubah tab "Ringkasan" agar merender `summaryContent` sebagai teks terformat langsung (bukan iframe). Tab "Lengkap" tetap tersedia untuk PDF jika nanti ada. Tab "Video" tetap menampilkan YouTube embed (placeholder kosong sampai Anda isi URL).

## Proposed Changes

### 1. Database Schema

#### [MODIFY] [schema.ts](file:///d:/UniMath/apps/web/src/lib/db/schema.ts)
Menambahkan 8 kolom baru ke tabel `materials`:
- `shortDescription` (text, nullable)
- `learningObjectives` (text, nullable — JSON string)
- `summaryContent` (text, nullable — teks panjang)
- `commonMistakes` (text, nullable — teks panjang)
- `remedialText` (text, nullable — teks untuk layar remedial)
- `videoDescription` (text, nullable — deskripsi konten video)
- `checkpointQuestion` (text, nullable — soal checkpoint)
- `checkpointAnswer` (text, nullable — jawaban checkpoint)

---

### 2. Seed Script

#### [NEW] [seed-materials-content.ts](file:///d:/UniMath/apps/web/src/lib/db/seed-materials-content.ts)
Script untuk meng-update 9 material yang sudah ada di database dengan konten akademik yang di-lock user. Script ini:
- Menggunakan `UPDATE` (bukan INSERT) karena material sudah dibuat oleh import sebelumnya
- Tidak mengubah substansi akademik apapun
- Menyimpan `learningObjectives` sebagai JSON array
- Menyimpan `videoUrl` sebagai `null` (placeholder)

---

### 3. API Routes

#### [MODIFY] [route.ts](file:///d:/UniMath/apps/web/src/app/api/student/materials/[materialId]/route.ts)
Menambahkan field baru ke response API agar frontend bisa mengaksesnya.

#### [MODIFY] [route.ts](file:///d:/UniMath/apps/web/src/app/api/student/materials/route.ts)
Menambahkan `shortDescription` ke response daftar material (untuk ditampilkan di card list).

---

### 4. Frontend Pages

#### [MODIFY] [page.tsx](file:///d:/UniMath/apps/web/src/app/student/materials/[materialId]/page.tsx)
Perubahan besar:
- Tab "Ringkasan" → merender `summaryContent` sebagai teks terformat (dengan support untuk heading, list, contoh soal)
- Menambahkan section **Tujuan Pembelajaran** (`learningObjectives`)
- Menambahkan section **Kesalahan Umum** (`commonMistakes`)
- Menambahkan section **Checkpoint** (`checkpointQuestion` + `checkpointAnswer`)
- Tab "Video" → tetap menampilkan YouTube embed, tapi menambahkan `videoDescription` sebagai fallback text jika URL belum diisi
- Menambahkan section **Remedial** yang hanya muncul jika siswa datang dari game-over (`remedialText`)

---

### 5. Package.json

#### [MODIFY] [package.json](file:///d:/UniMath/apps/web/package.json)
Menambahkan script `"db:seed-content": "npx tsx src/lib/db/seed-materials-content.ts"`

## Verification Plan

### Automated
1. `npx drizzle-kit push` — push schema baru
2. `npx tsx src/lib/db/seed-materials-content.ts` — seed konten
3. `npx next build` — pastikan tidak ada type error

### Manual
- Buka halaman `/student/materials/M1A_DISKON_HARGA_AKHIR` → verifikasi konten tampil
- Verifikasi tab Ringkasan menampilkan summaryContent
- Verifikasi Checkpoint muncul
- Verifikasi video section menampilkan placeholder text
