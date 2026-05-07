# 🏗️ Arsitektur Final UniMath V2 (Skripsi S1 Pendidikan Matematika)

Dokumen ini adalah rancangan teknis (*blueprint*) final untuk merevisi dan menyempurnakan aplikasi **UniMath** agar memiliki validitas tinggi sebagai media pembelajaran dan instrumen pengumpulan data penelitian S1.

---

## A. AUDIT SISTEM SAAT INI

**✅ Fitur yang Sudah Tepat:**
- Penggunaan Next.js 14 App Router, Turso (SQLite), dan Drizzle ORM (Kuat & Cepat).
- Manajemen *Role-based* (Admin, Guru, Siswa).
- Flow registrasi dan manajemen kelas oleh guru via NISN.
- UI interaktif dengan *Glassmorphism* dan Framer Motion.

**🔧 Fitur yang Harus Direvisi:**
- Penggunaan `sessionStorage` sebagai penyimpan status utama saat latihan. Harus diganti ke *Database-first approach*.
- Trigger Remedial: Saat ini hanya melempar siswa ke halaman materi setelah salah 4x, tanpa *workflow* kembali ke latihan yang mulus.
- Analytics Guru: Masih terlalu umum (hanya skor total/lantai), belum mengukur indikator kemampuan numerik (I1-I4).

**🔀 Fitur yang Harus Dipisah:**
- **Mode Tes (Pretest/Posttest)** dan **Mode Latihan** harus berada di tabel, UI, dan logika yang sepenuhnya terpisah untuk menjaga validitas data penelitian.

**➕ Fitur yang Harus Ditambah:**
- Metadata soal yang kuat (Indikator Numerik I1-I4, Target Remedial).
- Tabel `test_sessions` dan `test_attempts` independen.

**🗑️ Fitur yang Diturunkan Prioritasnya:**
- Efek animasi konfeti yang terlalu berat atau *Leaderboard* global (*Leaderboard* cukup di tingkat kelas agar siswa tidak *insecure*).

---

## B. ARSITEKTUR FINAL PRODUK

Sistem dipecah menjadi *domain logic* yang terisolasi:

1. **Modul Admin (CMS/Setup)**: Mengelola master data, khusus berfokus pada kualitas metadata *Question Bank*.
2. **Modul Guru (Analytics)**: Memantau ketercapaian indikator (I1-I4) per siswa, bukan sekadar melihat "Lantai ke berapa".
3. **Modul Siswa**: Portal navigasi utama.
4. **🔴 Mode Tes Penelitian (Strict Mode)**: 
   - Rute: `/student/test/[testId]`
   - Kondisi: *Timer* berjalan, tombol kembali dimatikan, tidak ada navigasi lain, *Hint* mati, *Confetti* mati, data langsung ke tabel `test_attempts`.
5. **🟢 Mode Latihan (Gamified Mode)**:
   - Rute: `/student/practice/[materialId]/play`
   - Kondisi: Robot Naik Gedung aktif, *Hint* aktif, adaptif aktif, wajib remedial jika beruntun salah.
6. **Data & Persistence Layer**: Semua aksi disinkronkan ke DB via `POST /api/...` secara *real-time*. `sessionStorage` murni hanya untuk *fallback loading state* UI.

---

## C. USER FLOW FINAL

1. **Flow Login Siswa**: Input NISN -> Cek DB -> Jika baru, Set Password -> Dashboard Siswa.
2. **Flow Siswa Masuk Mode Latihan**: Pilih Materi -> Cek DB apakah ada *resume session* -> Muat status UI -> Tampilkan Soal (Level sesuai lantai terakhir).
3. **Flow Siswa Menjawab Benar (Latihan)**: Klik Jawaban -> POST `/api/practice/answer` -> Respons Benar -> Animasi Naik Gedung (+1 Lantai) -> Poin Gamifikasi Cair -> Muat soal level setara/naik.
4. **Flow Siswa Salah Beruntun (Latihan)**:
   - Salah 1x: UI memunculkan tombol 💡 Hint 1. Siswa diam di soal yang sama.
   - Salah 2x: UI memunculkan tombol 💡 Hint 2.
   - Salah 3x: **[TRIGGER REMEDIAL]** -> Paksa pindah halaman / buka *Full Screen Modal*.
5. **Flow Remedial**: 
   - Siswa diwajibkan membaca ringkasan pop-up ATAU memutar klip video durasi pendek (dilacak dengan timer, misal 15 detik). 
   - Diberikan 1 *Soal Checkpoint* (sangat mudah) terkait materi remedial.
6. **Flow Setelah Remedial**: Jika *Checkpoint* benar -> Kembali ke soal Latihan yang tadi gagal. Jika salah lagi -> Tampilkan Hint 3 / Pembahasan penuh, lewati soal ini, *floor* tidak naik.
7. **Flow Mode Tes (Pre/Post)**: Buka rute Tes -> Tampil peringatan "Jangan tutup halaman" -> Soal muncul sekuensial (misal 20 soal) -> Tidak ada *feedback* benar/salah -> Klik Selesai -> Data tersimpan, tes terkunci selamanya.
8. **Flow Guru & Analytics**: Login -> Pilih Kelas -> Lihat *Heatmap* Indikator (I1-I4) -> Klik Export CSV (Data siap diolah di SPSS/Excel untuk skripsi).

---

## D. DATA MODEL / ENTITY (Drizzle ORM)

Perombakan fokus pada pemisahan Tes vs Latihan dan Metadata Soal.

```typescript
// 1. QUESTIONS METADATA
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  materialId: text('material_id').references(() => materials.id),
  mode: text('mode', { enum: ['PRACTICE', 'PRETEST', 'POSTTEST', 'ALL'] }).notNull(),
  indicator: text('indicator', { enum: ['I1', 'I2', 'I3', 'I4'] }).notNull(), // SANGAT PENTING UTK SKRIPSI
  difficulty: integer('difficulty').notNull(), // 1: Mudah, 2: Sedang, 3: Sulit
  questionType: text('question_type').default('PG'),
  questionStem: text('question_stem').notNull(),
  optA: text('opt_a'), optB: text('opt_b'), optC: text('opt_c'), optD: text('opt_d'),
  correctAnswer: text('correct_answer'),
  hint1: text('hint1'), hint2: text('hint2'), hint3: text('hint3'),
  explanation: text('explanation'),
  remedialMaterialId: text('remedial_material_id') // Link ke ringkasan spesifik
})

// 2. PRACTICE SESSIONS (Gamified)
export const practiceSessions = sqliteTable('practice_sessions', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => users.id),
  materialId: text('material_id').references(() => materials.id),
  floor: integer('floor').default(1),
  currentStreak: integer('current_streak').default(0), // Untuk adaptive logic
  status: text('status', { enum: ['ACTIVE', 'COMPLETED', 'ABANDONED'] }),
})

export const practiceAttempts = sqliteTable('practice_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => practiceSessions.id),
  questionId: text('question_id').references(() => questions.id),
  answer: text('answer'),
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  usedHintLevel: integer('used_hint_level').default(0), // 0, 1, 2
  isRemedialSession: integer('is_remedial_session', { mode: 'boolean' }).default(false),
  createdAt: text('created_at'),
})

// 3. TEST SESSIONS (Strict - Penelitian)
export const testSessions = sqliteTable('test_sessions', {
  id: text('id').primaryKey(),
  studentId: text('student_id'),
  testType: text('test_type', { enum: ['PRETEST', 'POSTTEST'] }),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
})

export const testAttempts = sqliteTable('test_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id'),
  questionId: text('question_id'),
  answer: text('answer'),
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  // TIDAK ADA HINT DI SINI
})
```

---

## E. LOGIKA SISTEM (Pseudocode)

### 1. Adaptive Difficulty (Latihan)
```text
IF mode == 'PRACTICE':
  IF practiceSessions.currentStreak >= 2:
    targetDifficulty = currentDifficulty + 1 (Maks 3)
  ELSE IF salah berturut-turut pada soal berbeda >= 2:
    targetDifficulty = currentDifficulty - 1 (Min 1)
  ELSE:
    targetDifficulty = currentDifficulty
```

### 2. Remedial Triggering
```text
ON answer_submitted:
  IF isCorrect == false:
    wrongCount = count(attempts for this questionId)
    IF wrongCount == 1:
      show(Hint 1)
    ELSE IF wrongCount == 2:
      show(Hint 2)
    ELSE IF wrongCount == 3:
      trigger_remedial_flow(question.remedialMaterialId)
      log_to_db("REMEDIAL_TRIGGERED")
```

### 3. Separation of Test vs Practice (API Level)
```text
ENDPOINT /api/test/submit:
  - DO NOT return isCorrect to client.
  - DO NOT update floor/points.
  - ONLY save attempt to test_attempts.
  - RETURN success: true.

ENDPOINT /api/practice/submit:
  - CALC points: base (10) - (hint_used * 3).
  - RETURN isCorrect, hints, adaptive_next_question.
```

---

## F. DAFTAR PRIORITAS IMPLEMENTASI

**🚀 1. Prioritas MVP (Wajib untuk Skripsi)**
- Pemisahan total rute UI & Database untuk Pretest/Posttest vs Latihan.
- Penambahan atribut Indikator (I1-I4) pada CSV *Upload* Soal Admin.
- Rekonstruksi tabel `attempts` agar tersimpan di Backend secara *real-time*.
- *Dashboard Analytics* Guru untuk melihat rekap I1-I4 per siswa (Kunci Validasi Data Bab 4 Skripsi).

**⭐ 2. Sangat Disarankan (Menjamin UX & Akurasi)**
- *Workflow* Remedial Modal (Memblokir layar hingga waktu remedial selesai).
- *Adaptive difficulty* dengan aturan 2 Benar = Naik Level, 2 Salah = Turun Level.

**🔧 3. Opsional / Boleh Ditunda**
- Avatar *custom* untuk siswa.
- Sistem *Leaderboard* lintas sekolah (Cukup lintas kelas saja).
- Badge/Achievements yang terlalu rumit syaratnya (Cukup sediakan *Badge* tamat level).

---

## G. REKOMENDASI PERUBAHAN FRONTEND / UX

1. **Halaman Tes (`/student/test`)**: UI minimalis putih/terang. Hapus gambar robot. Jangan tampilkan indikator benar/salah hijau/merah. Gunakan navigasi *pagination* (Soal 1 dari 20).
2. **Halaman Latihan (`/student/practice/play`)**: Pertahankan animasi *Naik Gedung*. Area *Hint* dibuat seperti *pop-up chat* dari sang Robot pembantu agar lebih interaktif.
3. **Halaman Remedial**: Gunakan *Full-Screen Modal* atau _Overlay_ yang **tidak memiliki tombol "X" (Close)**. Harus ada tombol "Lanjut Latihan" yang *disabled* (berhitung mundur 15 detik), memaksa siswa membaca layar.
4. **Halaman Guru (Analytics)**: Buat Tabel/Grafik Batang (*Bar Chart*) menggunakan library ringan (Recharts). Sumbu Y = Akurasi (%), Sumbu X = Indikator I1, I2, I3, I4. Ini akan sangat disukai oleh dosen pembimbing.

---

## H. RISK CHECK (Validasi Akademik)

⚠️ **Risiko Jika Mode Tes & Latihan Digabung:**
Data *Posttest* Anda dianggap "bias" oleh penguji skripsi karena *treatment* (Gamifikasi & Hint) ikut memengaruhi proses pengambilan tes. Mode tes **wajib** dibuat steril.

⚠️ **Risiko Penggunaan `sessionStorage` Secara Total:**
Jika siswa menekan F5/Refresh atau kuota internet habis sesaat, data skor yang sedang dikerjakan akan hilang dari RAM browser. Sesi latihan harus menggunakan *Server Action* / API untuk mencatat tiap 1 nomor.

⚠️ **Risiko Tanpa Metadata Indikator Numerik:**
Jika bank soal hanya punya kolom "Sulit/Mudah", skripsi Anda akan sulit membuktikan "Aspek numerik bagian mana yang meningkat?". Minimal `indicator` (I1-I4) harus ada di struktur *database* pertanyaan.
