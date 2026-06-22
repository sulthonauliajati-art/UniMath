# 📚 UniMath — Dokumentasi Lengkap & Menyeluruh (100% Tanpa Disensor)

> **Dokumen ini adalah hasil analisis mendalam seluruh source code proyek UniMath pada Juni 2026.**
> Ditujukan bagi siapa pun yang baru bergabung — dari yang belum tahu apa-apa hingga ke tingkat teknis paling dalam.

---

## DAFTAR ISI

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Struktur Direktori Lengkap](#3-struktur-direktori-lengkap)
4. [Database Schema (17 Tabel)](#4-database-schema-17-tabel)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
6. [Sistem Autentikasi (Detail Penuh)](#6-sistem-autentikasi-detail-penuh)
7. [Middleware (Edge Protection)](#7-middleware-edge-protection)
8. [Halaman & Fitur — SISWA](#8-halaman--fitur--siswa)
9. [Halaman & Fitur — GURU](#9-halaman--fitur--guru)
10. [Halaman & Fitur — ADMIN](#10-halaman--fitur--admin)
11. [Semua API Endpoints (30+)](#11-semua-api-endpoints-30)
12. [Logika Gameplay Penuh (Practice)](#12-logika-gameplay-penuh-practice)
13. [Logika Tes (Pretest/Posttest)](#13-logika-tes-pretestposttest)
14. [XP & Badge System](#14-xp--badge-system)
15. [Format Soal & CSV Import](#15-format-soal--csv-import)
16. [Komponen UI Reusable](#16-komponen-ui-reusable)
17. [State Management & Session Storage](#17-state-management--session-storage)
18. [Performa & Optimasi Database](#18-performa--optimasi-database)
19. [Keamanan Sistem](#19-keamanan-sistem)
20. [Environment Variables](#20-environment-variables)
21. [Semua Database Scripts (CLI)](#21-semua-database-scripts-cli)
22. [Alur Lengkap User Journey](#22-alur-lengkap-user-journey)
23. [Relasi Antar Entitas (ERD)](#23-relasi-antar-entitas-erd)
24. [Catatan Bug & Fix yang Sudah Dilakukan](#24-catatan-bug--fix-yang-sudah-dilakukan)
25. [Status Pengembangan Saat Ini](#25-status-pengembangan-saat-ini)

---

## 1. Gambaran Umum

**UniMath** adalah platform web edukasi interaktif berbasis gamifikasi untuk meningkatkan kemampuan **numerasi matematika** (aritmatika kontekstual: diskon, PPN, untung-rugi, bunga, bruto-neto) siswa sekolah dasar/menengah kelas 4–6.

### Filosofi Desain
- **Belajar seperti game**: Siswa "mendaki gedung virtual" — setiap jawaban benar = naik 1 lantai
- **Adaptive difficulty**: Soal menjadi lebih mudah jika salah, lebih sulit jika benar (real-time)
- **XP & Badge**: Reward nyata berbentuk poin (XP) yang menentukan badge level siswa
- **Wajib Belajar / Remedial Gate**: Salah 3× berturut → diblokir, wajib baca materi dulu
- **Multi-role**: 3 jenis pengguna dengan akses berbeda (Admin/Guru/Siswa)

### Target Pengguna
| Role | Login | Akses |
|------|-------|-------|
| **STUDENT** | NISN + password | Latihan, tes, dashboard personal |
| **TEACHER** | Email + password | Pantau murid, kelola kelas & sekolah |
| **ADMIN** | Email + password | Semua: user, materi, soal, laporan |

---

## 2. Tech Stack & Dependencies

### Dependencies Utama (dari `package.json`)

```json
{
  "dependencies": {
    "@libsql/client": "^0.15.15",    ← Turso DB client
    "bcryptjs": "^3.0.3",            ← Hash password
    "canvas-confetti": "^1.9.3",     ← Animasi confetti saat benar
    "clsx": "^2.1.1",                ← CSS class utility
    "drizzle-orm": "^0.45.1",        ← ORM SQLite
    "framer-motion": "^11.11.17",    ← Animasi UI
    "next": "14.2.18",               ← Framework
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "resend": "^6.6.0"               ← Email OTP (untuk guru)
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8",        ← Migration CLI
    "tailwindcss": "^3.4.14",
    "tsx": "^4.21.0",                ← Run TypeScript scripts
    "typescript": "^5.6.3"
  }
}
```

### Semua Scripts yang Tersedia

```bash
# Dev & Build
npm run dev          → next dev (localhost:3000)
npm run build        → next build (production)
npm run start        → next start
npm run lint         → next lint

# Database Operations
npm run db:generate         → drizzle-kit generate (buat migration dari schema)
npm run db:push             → drizzle-kit push (apply schema ke DB)
npm run db:studio           → drizzle-kit studio (GUI DB browser)
npm run db:seed             → npx tsx src/lib/db/seed.ts
npm run db:seed-achievements → npx tsx src/lib/db/seed-achievements.ts
npm run db:import           → npx tsx src/lib/db/import-practice.ts
npm run db:import-master    → npx tsx src/lib/db/import-master-practice.ts
npm run db:import-content   → npx tsx src/lib/db/import-material-contents.ts
npm run db:update-checkpoints → npx tsx src/lib/db/update-checkpoints.ts
npm run db:seed-content     → npx tsx src/lib/db/seed-materials-content.ts
npm run db:generate-tests   → npx tsx src/lib/db/generate-test-questions.ts
```

---

## 3. Struktur Direktori Lengkap

```
d:\UniMath\
├── apps/
│   └── web/                           ← Next.js application
│       ├── public/                    ← Static assets (images, icons)
│       ├── src/
│       │   ├── app/                   ← Next.js App Router pages & API
│       │   │   ├── layout.tsx         ← Root layout (providers wrapper)
│       │   │   ├── page.tsx           ← Landing page (/)
│       │   │   ├── maintenance/       ← Halaman maintenance mode
│       │   │   ├── admin/
│       │   │   │   ├── achievements/page.tsx
│       │   │   │   ├── dashboard/page.tsx
│       │   │   │   ├── login/page.tsx
│       │   │   │   ├── materials/page.tsx
│       │   │   │   ├── questions/page.tsx
│       │   │   │   ├── reports/page.tsx
│       │   │   │   └── users/page.tsx
│       │   │   ├── teacher/
│       │   │   │   ├── classes/page.tsx
│       │   │   │   ├── dashboard/page.tsx
│       │   │   │   ├── forgot-password/page.tsx
│       │   │   │   ├── login/page.tsx
│       │   │   │   ├── profile/page.tsx
│       │   │   │   ├── reports/page.tsx
│       │   │   │   ├── schools/page.tsx
│       │   │   │   └── students/page.tsx
│       │   │   ├── student/
│       │   │   │   ├── achievements/page.tsx
│       │   │   │   ├── dashboard/page.tsx
│       │   │   │   ├── leaderboard/page.tsx
│       │   │   │   ├── login/page.tsx
│       │   │   │   ├── materials/[materialId]/page.tsx
│       │   │   │   ├── practice/
│       │   │   │   │   ├── page.tsx           ← Auto-redirect ke materi
│       │   │   │   │   ├── complete/page.tsx  ← Halaman selesai latihan
│       │   │   │   │   └── [materialId]/
│       │   │   │   │       ├── play/page.tsx  ← Gameplay utama (802 baris!)
│       │   │   │   │       └── start/page.tsx ← Konfirmasi mulai
│       │   │   │   ├── profile/page.tsx
│       │   │   │   └── test/
│       │   │   │       ├── page.tsx
│       │   │   │       └── [materialId]/
│       │   │   │           └── [testType]/
│       │   │   │               ├── page.tsx
│       │   │   │               └── StrictTestClient.tsx
│       │   │   └── api/
│       │   │       ├── auth/
│       │   │       │   ├── admin/route.ts
│       │   │       │   ├── logout/route.ts
│       │   │       │   ├── me/route.ts
│       │   │       │   ├── profile/route.ts
│       │   │       │   ├── student/
│       │   │       │   │   ├── change-password/route.ts
│       │   │       │   │   ├── check-nisn/route.ts
│       │   │       │   │   ├── login/route.ts
│       │   │       │   │   ├── register/route.ts
│       │   │       │   │   ├── reset-password/route.ts
│       │   │       │   │   └── set-password/route.ts
│       │   │       │   └── teacher/
│       │   │       │       ├── login/route.ts
│       │   │       │       ├── forgot-password/route.ts
│       │   │       │       └── reset-password/route.ts
│       │   │       ├── leaderboard/route.ts
│       │   │       ├── practice/
│       │   │       │   ├── answer/route.ts    ← Core gameplay (344 baris)
│       │   │       │   ├── current/route.ts   ← Resume sesi aktif
│       │   │       │   ├── end/route.ts       ← Akhiri sesi
│       │   │       │   └── start/route.ts     ← Mulai/resume sesi (357 baris)
│       │   │       ├── student/
│       │   │       │   ├── achievements/route.ts
│       │   │       │   ├── materials/[id]/content/route.ts
│       │   │       │   ├── materials/[id]/route.ts
│       │   │       │   ├── materials/route.ts
│       │   │       │   ├── progress/route.ts
│       │   │       │   ├── report/route.ts
│       │   │       │   └── stats/route.ts
│       │   │       ├── teacher/
│       │   │       │   ├── classes/route.ts
│       │   │       │   ├── schools/route.ts
│       │   │       │   └── students/route.ts
│       │   │       ├── test/
│       │   │       │   ├── answer/route.ts
│       │   │       │   ├── finish/route.ts
│       │   │       │   └── start/route.ts
│       │   │       └── admin/
│       │   │           ├── achievements/route.ts
│       │   │           ├── export/
│       │   │           │   ├── practice/route.ts  ← Export CSV latihan (219 baris)
│       │   │           │   └── research/route.ts  ← Export CSV riset
│       │   │           ├── materials/route.ts
│       │   │           ├── questions/
│       │   │           │   ├── route.ts
│       │   │           │   ├── template/route.ts
│       │   │           │   └── upload/route.ts    ← CSV parser (432 baris)
│       │   │           └── users/route.ts
│       │   ├── components/
│       │   │   └── ui/
│       │   │       ├── BgmProvider.tsx
│       │   │       ├── DisplayModeProvider.tsx
│       │   │       ├── FontSizeProvider.tsx
│       │   │       ├── GlassCard.tsx
│       │   │       ├── index.ts
│       │   │       ├── Input.tsx
│       │   │       ├── LoadingScreen.tsx
│       │   │       ├── Modal.tsx
│       │   │       ├── NeonButton.tsx
│       │   │       ├── ProgressBar.tsx
│       │   │       ├── RobotMascot.tsx
│       │   │       ├── SettingsPanel.tsx
│       │   │       ├── StarryBackground.tsx
│       │   │       ├── Toast.tsx
│       │   │       └── TowerBackground.tsx
│       │   ├── lib/
│       │   │   ├── auth/
│       │   │   │   ├── context.tsx    ← React Context untuk auth state
│       │   │   │   └── utils.ts       ← hashPassword, createToken, validateToken
│       │   │   ├── db/
│       │   │   │   ├── client.ts      ← Turso DB connection
│       │   │   │   ├── schema.ts      ← Drizzle ORM schema (252 baris)
│       │   │   │   ├── seed.ts        ← Seed data awal
│       │   │   │   ├── seed-achievements.ts
│       │   │   │   ├── seed-materials-content.ts
│       │   │   │   ├── import-practice.ts
│       │   │   │   ├── import-master-practice.ts
│       │   │   │   ├── import-material-contents.ts
│       │   │   │   ├── update-checkpoints.ts
│       │   │   │   └── generate-test-questions.ts
│       │   │   └── types.ts           ← TypeScript type definitions
│       │   ├── styles/
│       │   │   └── globals.css        ← Global CSS + Tailwind directives
│       │   └── middleware.ts          ← Edge middleware (auth + maintenance)
│       ├── drizzle/                   ← Drizzle migration files
│       ├── drizzle.config.ts          ← Drizzle Kit configuration
│       ├── next.config.ts             ← Next.js config
│       ├── tailwind.config.ts         ← Tailwind + custom design tokens
│       └── package.json
├── bank-soal-final/                   ← CSV bank soal (di luar source)
│   ├── M1A_DISKON_HARGA_AKHIR.csv
│   ├── M1B_PPN_BIAYA_LAYANAN_ONGKIR.csv
│   ├── M1C_UNTUNG_RUGI_PERSENTASE.csv
│   ├── M1D_BUNGA_SEDERHANA.csv
│   ├── M1E_BRUTO_NETO_TARA.csv
│   ├── M1F_PROMO_TRANSAKSI_KEPUTUSAN.csv
│   ├── R1_OPERASI_PERSEN_DASAR.csv
│   ├── R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH.csv
│   └── R3_PEMBAGIAN_DAN_HARGA_PER_UNIT.csv
└── docs/                              ← Dokumentasi tambahan
```

---

## 4. Database Schema (17 Tabel)

Database: **Turso** (libSQL / SQLite edge-hosted). ORM: **Drizzle ORM**.

### 4.1 `users`
```typescript
sqliteTable('users', {
  id:             text('id').primaryKey(),              // e.g. "T001", "ST001"
  role:           text('role', { enum: ['STUDENT','TEACHER','ADMIN'] }).notNull(),
  nisn:           text('nisn'),                         // Hanya siswa
  name:           text('name').notNull(),
  email:          text('email'),                        // Hanya guru & admin
  password:       text('password'),                     // bcrypt hash
  passwordStatus: text('password_status', { enum: ['UNSET','SET'] }).default('UNSET'),
  avatarUrl:      text('avatar_url'),
  totalPoints:    integer('total_points').default(0),   // Total XP siswa
  createdAt:      text('created_at').notNull(),
}, {
  roleIdx: index('users_role_idx').on(role),            // Filter by role
  nisnIdx: index('users_nisn_idx').on(nisn),            // Cari by NISN
})
```

### 4.2 `teacher_profiles`
```typescript
sqliteTable('teacher_profiles', {
  userId:      text('user_id').primaryKey().references(() => users.id),
  displayName: text('display_name').notNull(),
  points:      integer('points').notNull().default(0),  // Reward dari aktivitas murid
})
```

### 4.3 `schools`
```typescript
sqliteTable('schools', {
  id:              text('id').primaryKey(),
  name:            text('name').notNull(),
  ownerTeacherId:  text('owner_teacher_id').notNull().references(() => users.id),
  createdAt:       text('created_at').notNull(),
})
```

### 4.4 `teacher_schools` (many-to-many)
```typescript
sqliteTable('teacher_schools', {
  teacherId: text('teacher_id').notNull().references(() => users.id),
  schoolId:  text('school_id').notNull().references(() => schools.id),
})
```

### 4.5 `classes`
```typescript
sqliteTable('classes', {
  id:        text('id').primaryKey(),
  schoolId:  text('school_id').notNull().references(() => schools.id),
  name:      text('name').notNull(),
  grade:     text('grade').notNull(),
  createdAt: text('created_at').notNull(),
})
```

### 4.6 `class_students` (many-to-many)
```typescript
sqliteTable('class_students', {
  classId:        text('class_id').notNull().references(() => classes.id),
  studentUserId:  text('student_user_id').notNull().references(() => users.id),
}, {
  studentIdx: index('class_students_student_idx').on(studentUserId),
  classIdx:   index('class_students_class_idx').on(classId),
})
```

### 4.7 `materials`
```typescript
sqliteTable('materials', {
  id:                 text('id').primaryKey(),          // "M1A","M1B",...,"R1","R2","R3"
  title:              text('title').notNull(),
  description:        text('description'),
  shortDescription:   text('short_description'),
  grade:              text('grade').notNull().default('4'),
  summaryUrl:         text('summary_url'),             // Google Drive PDF ringkasan
  fullUrl:            text('full_url'),                // Google Drive PDF lengkap
  videoUrl:           text('video_url'),               // YouTube embed URL
  thumbnailUrl:       text('thumbnail_url'),
  order:              integer('order').notNull(),
  isActive:           integer('is_active', {mode:'boolean'}).notNull().default(true),
  createdAt:          text('created_at'),
  // === Konten Akademik ===
  learningObjectives: text('learning_objectives'),     // JSON array of strings
  summaryContent:     text('summary_content'),
  commonMistakes:     text('common_mistakes'),
  remedialText:       text('remedial_text'),
  videoDescription:   text('video_description'),
  checkpointQuestion: text('checkpoint_question'),     // DEPRECATED (pakai material_contents)
  checkpointAnswer:   text('checkpoint_answer'),       // DEPRECATED
})
```

**Daftar Materi yang Ada:**

| ID | Judul | Tipe | Order |
|----|-------|------|-------|
| M1A | Diskon & Harga Akhir | MAIN | 1 |
| M1B | PPN, Biaya Layanan & Ongkir | MAIN | 2 |
| M1C | Untung, Rugi & Persentase | MAIN | 3 |
| M1D | Bunga Sederhana | MAIN | 4 |
| M1E | Bruto, Neto & Tara | MAIN | 5 |
| M1F | Promo & Keputusan Transaksi | MAIN | 6 |
| R1 | Operasi Persen Dasar | REMEDIAL | 7 |
| R2 | Total Bayar & Operasi Rupiah | REMEDIAL | 8 |
| R3 | Pembagian & Harga per Unit | REMEDIAL | 9 |

### 4.8 `material_contents`
```typescript
sqliteTable('material_contents', {
  id:                      text('id').primaryKey(),    // "M1A-SHORT", "M1A-FULL", "R1-FULL"
  materialId:              text('material_id').notNull(),
  materialType:            text('material_type'),      // "MAIN" | "REMEDIAL"
  contentVariant:          text('content_variant'),    // "SHORT" | "FULL"
  displayTitle:            text('display_title'),
  shortDescription:        text('short_description'),
  whyRedirected:           text('why_redirected'),     // Penjelasan kenapa masuk remedial
  learningObjectives:      text('learning_objectives'),// JSON array
  conceptText:             text('concept_text'),
  formulas:                text('formulas'),           // JSON array rumus
  steps:                   text('steps'),              // JSON array langkah
  examples:                text('examples'),           // JSON array contoh
  commonMistakes:          text('common_mistakes'),    // JSON array
  checkpointItems:         text('checkpoint_items'),   // JSON array soal uji pemahaman
  bodyMarkdown:            text('body_markdown'),      // Full markdown content
  wajibBelajarMessage:     text('wajib_belajar_message'),
  triggerCommonErrors:     text('trigger_common_errors'), // semicolon-separated
  relatedFloorStart:       integer('related_floor_start'),
  relatedFloorEnd:         integer('related_floor_end'),
  relatedIndicators:       text('related_indicators'), // comma-separated
  relatedRemedialIds:      text('related_remedial_ids'),
  estimatedReadingMinutes: integer('estimated_reading_minutes'),
  isActive:                integer('is_active', {mode:'boolean'}).default(true),
})
```

### 4.9 `questions`
```typescript
sqliteTable('questions', {
  id:                text('id').primaryKey(),
  materialId:        text('material_id').notNull().references(() => materials.id),
  mode:              text('mode', { enum: ['PRACTICE','PRETEST','POSTTEST','ALL'] }).default('ALL'),
  indicator:         text('indicator', { enum: ['I1','I2','I3','I4'] }).default('I1'),
  difficulty:        integer('difficulty').notNull(),  // 1=Mudah, 2=Sedang, 3=Sulit
  questionType:      text('question_type').default('PG'), // 'PG' | 'URAIAN'
  question:          text('question').notNull(),
  optA:              text('opt_a').notNull(),
  optB:              text('opt_b').notNull(),
  optC:              text('opt_c').notNull(),
  optD:              text('opt_d').notNull(),
  optE:              text('opt_e').notNull().default(''), // Opsional, string kosong = tidak ada
  correct:           text('correct', { enum: ['A','B','C','D','E'] }).notNull(),
  hint1:             text('hint1'),          // Muncul setelah salah 1×
  hint2:             text('hint2'),          // Muncul setelah salah 2×
  hint3:             text('hint3'),
  explanation:       text('explanation'),    // Penjelasan saat masuk wajib belajar
  remedialMaterialId: text('remedial_material_id'),
}, {
  // ⚡ CRITICAL INDEX — dipakai setiap jawaban siswa
  materialDifficultyIdx: index('questions_material_difficulty_idx')
    .on(materialId, difficulty, mode),
  materialIdx: index('questions_material_idx').on(materialId),
})
```

### 4.10 `practice_sessions`
```typescript
sqliteTable('practice_sessions', {
  id:                text('id').primaryKey(),
  studentUserId:     text('student_user_id').notNull().references(() => users.id),
  materialId:        text('material_id').notNull().references(() => materials.id),
  floor:             integer('floor').notNull().default(1),          // Lantai saat ini
  consecutiveWrong:  integer('consecutive_wrong').notNull().default(0), // Reset saat benar
  currentDifficulty: integer('current_difficulty').notNull().default(2),// 1-3
  currentStreak:     integer('current_streak').notNull().default(0),
  currentQuestionId: text('current_question_id'),                    // Soal aktif saat ini
  startedAt:         text('started_at').notNull(),
  endedAt:           text('ended_at'),
  status:            text('status', {
    enum: ['ACTIVE','COMPLETED','ABANDONED','REMEDIAL_REQUIRED']
  }).notNull().default('ACTIVE'),
}, {
  // ⚡ CRITICAL — setiap request halaman latihan
  studentStatusIdx:   index('practice_sessions_student_status_idx').on(studentUserId, status),
  studentMaterialIdx: index('practice_sessions_student_material_idx').on(studentUserId, materialId),
  studentIdx:         index('practice_sessions_student_idx').on(studentUserId),
})
```

### 4.11 `practice_attempts`
```typescript
sqliteTable('practice_attempts', {
  id:                  text('id').primaryKey(),
  sessionId:           text('session_id').notNull().references(() => practiceSessions.id),
  floor:               integer('floor').notNull(),
  questionId:          text('question_id').notNull().references(() => questions.id),
  answer:              text('answer', { enum: ['A','B','C','D','E'] }).notNull(),
  isCorrect:           integer('is_correct', {mode:'boolean'}).notNull(),
  xpAwarded:           integer('xp_awarded').notNull().default(0),
  hintCountAtAnswer:   integer('hint_count_at_answer').default(0),
  difficultyAtAnswer:  integer('difficulty_at_answer').notNull(),
  isRemedialSession:   integer('is_remedial_session', {mode:'boolean'}).default(false),
  responseMs:          integer('response_ms').notNull(),             // Waktu respons (ms)
  createdAt:           text('created_at').notNull(),
}, {
  sessionIdx:        index('practice_attempts_session_idx').on(sessionId),
  sessionCorrectIdx: index('practice_attempts_session_correct_idx').on(sessionId, isCorrect),
})
```

### 4.12 `test_sessions`
```typescript
sqliteTable('test_sessions', {
  id:             text('id').primaryKey(),
  studentUserId:  text('student_user_id').notNull().references(() => users.id),
  materialId:     text('material_id').notNull().references(() => materials.id),
  testType:       text('test_type', { enum: ['PRETEST','POSTTEST'] }).notNull(),
  startedAt:      text('started_at').notNull(),
  completedAt:    text('completed_at'),              // NULL = belum selesai
}, {
  studentTypeIdx: index('test_sessions_student_type_idx').on(studentUserId, testType),
})
```

### 4.13 `test_attempts`
```typescript
sqliteTable('test_attempts', {
  id:         text('id').primaryKey(),
  sessionId:  text('session_id').notNull().references(() => testSessions.id),
  questionId: text('question_id').notNull().references(() => questions.id),
  answer:     text('answer').notNull(),              // Tidak dibatasi enum (untuk URAIAN)
  isCorrect:  integer('is_correct', {mode:'boolean'}), // NULL untuk URAIAN
  responseMs: integer('response_ms'),
  createdAt:  text('created_at').notNull(),
}, {
  sessionIdx: index('test_attempts_session_idx').on(sessionId),
})
```

### 4.14 `auth_tokens`
```typescript
sqliteTable('auth_tokens', {
  token:     text('token').primaryKey(),             // Format: "role_userId_timestamp_random"
  userId:    text('user_id').notNull().references(() => users.id),
  role:      text('role', { enum: ['STUDENT','TEACHER','ADMIN'] }).notNull(),
  expiresAt: text('expires_at').notNull(),           // ISO 8601, expire 7 hari
}, {
  // Untuk revokeAllUserTokens (DELETE WHERE user_id = ?)
  userIdIdx: index('auth_tokens_user_id_idx').on(userId),
})
```

### 4.15 `password_reset_otp`
```typescript
sqliteTable('password_reset_otp', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id),
  otp:       text('otp').notNull(),
  expiresAt: text('expires_at').notNull(),
  used:      integer('used', {mode:'boolean'}).notNull().default(false),
  createdAt: text('created_at').notNull(),
})
```

### 4.16 `achievements`
```typescript
sqliteTable('achievements', {
  id:          text('id').primaryKey(),             // 'ACH001', 'ACH002', ...
  name:        text('name').notNull(),
  description: text('description').notNull(),
  icon:        text('icon').notNull(),              // Emoji
  type:        text('type', { enum: ['FLOOR','ACCURACY','STREAK','MATERIAL','SPECIAL'] }),
  requirement: integer('requirement').notNull(),   // Threshold value
  points:      integer('points').notNull().default(10),
})
```

**Seluruh Data Achievement:**
| ID | Nama | Tipe | Requirement | Poin |
|----|------|------|-------------|------|
| ACH001 | Mulai Pertama Kali | FLOOR | 1 | 10 |
| ACH002 | Naik 10 Lantai | FLOOR | 10 | 20 |
| ACH003 | Naik 25 Lantai | FLOOR | 25 | 30 |
| ACH004 | Naik 50 Lantai | FLOOR | 50 | 50 |
| ACH005 | Naik 100 Lantai | FLOOR | 100 | 100 |
| ACH006 | Akurasi 60% | ACCURACY | 60 | 20 |
| ACH007 | Akurasi 70% | ACCURACY | 70 | 30 |
| ACH008 | Akurasi 80% | ACCURACY | 80 | 50 |
| ACH009 | Akurasi 90% | ACCURACY | 90 | 100 |
| ACH010 | Rajin Latihan | STREAK | 5 | 20 |
| ACH011 | Konsisten | STREAK | 10 | 40 |
| ACH012 | Tekun | STREAK | 25 | 60 |
| ACH013 | Master Latihan | STREAK | 50 | 100 |

### 4.17 `student_achievements`
```typescript
sqliteTable('student_achievements', {
  id:             text('id').primaryKey(),
  studentUserId:  text('student_user_id').notNull().references(() => users.id),
  achievementId:  text('achievement_id').notNull().references(() => achievements.id),
  earnedAt:       text('earned_at').notNull(),
})
```

---

## 5. Arsitektur Sistem

```
Browser
  │
  ├── localStorage: unimath_token, unimath_user
  ├── sessionStorage: practiceSession, practiceStats, studyMaterial
  └── Cookies: user={JSON}, token=string (expire 7 hari)
          │
          ▼
  Next.js 14 App Router (Edge Runtime)
          │
  ┌───────┴────────────────────────────────┐
  │   src/middleware.ts (Edge Middleware)   │
  │   - Maintenance mode check             │
  │   - Role-based auth redirect           │
  └───────┬────────────────────────────────┘
          │
  ┌───────┴───────────────────────────────────────┐
  │     Pages (React Server + Client Components)   │
  │  /student/*   /teacher/*   /admin/*           │
  └───────┬───────────────────────────────────────┘
          │ fetch() / Server Actions
          ▼
  ┌─────────────────────────────┐
  │   API Routes (/api/*)       │
  │   - Validate token (DB)     │
  │   - Business logic          │
  │   - Return JSON             │
  └──────────┬──────────────────┘
             │
             ▼
  ┌──────────────────────┐
  │   Drizzle ORM        │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │   Turso (libSQL / SQLite cloud)  │
  │   Edge-replicated, low latency   │
  └──────────────────────────────────┘
```

### React Context Providers (src/app/providers.tsx)
Semua children dibungkus dalam urutan:
1. `AuthProvider` — user state, token, login/logout
2. `DisplayModeProvider` — dark/light mode
3. `FontSizeProvider` — ukuran font (sm/md/lg)
4. `BgmProvider` — background music

---

## 6. Sistem Autentikasi (Detail Penuh)

### 6.1 AuthContext (`src/lib/auth/context.tsx`)

```typescript
// localStorage keys
TOKEN_KEY = 'unimath_token'
USER_KEY  = 'unimath_user'

// State yang dikelola
user: User | null
token: string | null
isLoading: boolean

// Methods
login(user, token)      → setUser + setToken + localStorage + cookie
logout()                → POST /api/auth/logout → clear everything
refreshUser()           → GET /api/auth/me → validate token di server
updateUser(user)        → update user state + localStorage + cookie
```

**Login Flow (client-side):**
1. `login()` dipanggil dengan data dari API
2. `setUser(newUser)` dan `setToken(newToken)` ke React state
3. `localStorage.setItem('unimath_token', newToken)`
4. `localStorage.setItem('unimath_user', JSON.stringify(newUser))`
5. `document.cookie = 'user=JSON; path=/; max-age=604800'`
6. `document.cookie = 'token=STRING; path=/; max-age=604800'`

**Logout Flow:**
1. `POST /api/auth/logout` dengan Bearer token
2. Server hapus token dari `auth_tokens` tabel
3. Client: clear React state + localStorage + cookies

**Token Refresh (saat page load):**
```
localStorage.getItem('unimath_token')
  → null: isLoading=false, user=null (perlu login)
  → ada: GET /api/auth/me (Bearer token)
    → 200: setUser(data.user), setToken
    → error: clear localStorage, user=null
    → network error: pakai cache dari localStorage (offline support)
```

### 6.2 Token Utils (`src/lib/auth/utils.ts`)

```typescript
// Hash password (10 salt rounds)
hashPassword(password: string): Promise<string>

// Verifikasi password
verifyPassword(password: string, hash: string): Promise<boolean>

// Generate token: "role_userId_timestamp_random12char"
generateToken(prefix: string, userId: string): string

// Create dan simpan token ke DB (expire 7 hari)
createAuthToken(userId, role, expiresInDays=7): Promise<string>

// Validasi token: query auth_tokens, cek expires_at > NOW()
validateToken(token: string): Promise<{valid, userId?, role?}>
```

### 6.3 Auth Resolution di API Routes

Setiap API yang butuh autentikasi menggunakan fungsi `resolveAuthenticatedUserId()` dengan prioritas:
1. **Authorization header**: `Bearer {token}` → `validateToken()`
2. **Cookie `auth_token`**: (server-set token)
3. **Cookie `token`**: (client-set oleh AuthContext `login()`)
4. **Cookie `user`** (legacy fallback): parse JSON, cek `id !== 'anonymous'`

### 6.4 Password Flow Siswa (UNSET → SET)

```
Guru/Admin daftarkan siswa
    ↓ passwordStatus = 'UNSET'

Siswa masukkan NISN
    ↓ POST /api/auth/student/check-nisn
    ↓ Return { exists: true, passwordStatus: 'UNSET' }

Client redirect → /student/login/set-password
    ↓ Siswa masukkan password baru

POST /api/auth/student/set-password
    ↓ bcrypt hash password
    ↓ UPDATE users SET password=hash, password_status='SET'
    ↓ createAuthToken()

Client: login() → Dashboard
```

### 6.5 Password Reset Guru (via OTP Email)

```
Guru klik "Lupa Password" → masukkan email
    ↓ POST /api/auth/teacher/forgot-password
    ↓ Generate 6-digit OTP, simpan ke password_reset_otp
    ↓ Kirim email via Resend API

Guru masukkan OTP
    ↓ POST /api/auth/teacher/reset-password
    ↓ Validasi OTP (belum expired, belum dipakai)
    ↓ Hash password baru
    ↓ UPDATE users SET password = hash
    ↓ Mark OTP as used
```

---

## 7. Middleware (Edge Protection)

File: `src/middleware.ts` — berjalan di **Edge Runtime**, sebelum semua request.

### Matcher
```typescript
config.matcher = '/((?!_next/static|_next/image|favicon.ico).*)'
// → Semua path KECUALI static files Next.js
```

### Alur Logika Middleware

```
SETIAP REQUEST HTTP
    │
    ▼
[1] MAINTENANCE MODE CHECK (jika NEXT_PUBLIC_MAINTENANCE_MODE=true)
    ├── Path adalah /maintenance atau /_next/* atau aset statis → NEXT
    ├── Cookie 'maintenance_bypass' = key → NEXT
    ├── Query param ?bypass=key → set cookie bypass → REDIRECT ke pathname
    ├── Path adalah /api/admin/* → NEXT (admin tetap bisa akses)
    └── Semua lainnya → REDIRECT ke /maintenance

[2] NORMAL AUTH LOGIC
    │
    ├── Parse cookie 'user' → user.role
    ├── Cek cookie 'token' ada atau tidak
    ├── isAuthenticated = user && user.role && token
    │
    ├── PUBLIC_PATHS (/admin/login, /teacher/login, /teacher/register, 
    │   /teacher/forgot-password, /teacher/reset-password, /student/login)
    │   ├── isAuthenticated → REDIRECT ke dashboard sesuai role
    │   └── tidak auth → NEXT (boleh akses login page)
    │
    ├── Path tidak /admin/* /teacher/* /student/* → NEXT (bebas)
    │
    ├── isAuthenticated === false → REDIRECT ke login sesuai path
    └── user.role !== requiredRole → REDIRECT ke dashboard role user

// DASHBOARD MAPPING:
// ADMIN   → /admin/dashboard
// TEACHER → /teacher/dashboard
// STUDENT → /student/dashboard
```

---

## 8. Halaman & Fitur — SISWA

### 8.1 `/student/login` — Login Siswa
- Input NISN → check via `POST /api/auth/student/check-nisn`
  - NISN tidak ada → error "Hubungi guru Anda"
  - UNSET → tampilkan form set password baru
  - SET → tampilkan form password
- Submit password → `POST /api/auth/student/login` → buat token → login

### 8.2 `/student/dashboard` — Dashboard Utama

**Data yang diambil:**
1. `GET /api/student/stats` (Bearer token) → `totalFloors, accuracy, totalSessions, rank`
2. `GET /api/student/progress` (tanpa auth header, pakai cookie) → `totalXP`

**Komponen UI:**
- **Header**: Logo Unimath + nama user + link ke profil (avatar robot 🤖) + tombol logout
- **Rank Badge (lingkaran)**: Warna emas/perak/perunggu/biru sesuai posisi leaderboard, menampilkan format `#N`
- **Badge Level**: Emoji + nama badge berdasarkan totalXP
- **XP Info**: "🔥 X XP lagi untuk mencapai [Badge berikutnya]"
- **3-column stats**: `Akurasi | Badge | Lantai`
- **CTA Utama**: "Lanjut Perjalanan" / "Mulai Misi Pertama" → `/student/practice`
- **Grid 4 Kartu**: Daftar Materi | Leaderboard | Tes | Profil
- **Onboarding Modal** (hanya sekali, trigger: `totalSessions === 0 && !localStorage.getItem('unimath_onboarding_seen')`)
  - Langkah 1: "🤖 Bantu Robot Naik Gedung!"
  - Langkah 2: "🏢 Naik Lantai = Progress"
  - Langkah 3: "🎯 Akurasi Penting!"
  - Setelah tutup → `localStorage.setItem('unimath_onboarding_seen', 'true')`

**getBadge() function:**
```typescript
function getBadge(xp: number) {
  if (xp >= 500) return { name: 'Master',   emoji: '👑', color: 'text-yellow-300' }
  if (xp >= 300) return { name: 'Diamond',  emoji: '💎', color: 'text-cyan-300' }
  if (xp >= 150) return { name: 'Gold',     emoji: '🏅', color: 'text-amber-400' }
  if (xp >= 80)  return { name: 'Silver',   emoji: '🥈', color: 'text-gray-300' }
  if (xp >= 30)  return { name: 'Bronze',   emoji: '🥉', color: 'text-orange-400' }
  return          { name: 'Starter',   emoji: '⭐', color: 'text-slate-400' }
}
```

**getNextBadgeInfo() function:**
```typescript
function getNextBadgeInfo(xp: number) {
  if (xp < 30)  return { nextName:'Bronze',  nextEmoji:'🥉', xpNeeded:30,  xpRemaining:30-xp }
  if (xp < 80)  return { nextName:'Silver',  nextEmoji:'🥈', xpNeeded:80,  xpRemaining:80-xp }
  if (xp < 150) return { nextName:'Gold',    nextEmoji:'🏅', xpNeeded:150, xpRemaining:150-xp }
  if (xp < 300) return { nextName:'Diamond', nextEmoji:'💎', xpNeeded:300, xpRemaining:300-xp }
  if (xp < 500) return { nextName:'Master',  nextEmoji:'👑', xpNeeded:500, xpRemaining:500-xp }
  return null  // sudah Master
}
```

### 8.3 `/student/practice` — Auto-Redirect ke Latihan

Halaman ini **tidak menampilkan daftar materi** — langsung auto-redirect:

```
FLOW (resolveAndRedirect):
1. GET /api/practice/current (Bearer token)
   → Ada sesi AKTIF: simpan ke sessionStorage → redirect ke /student/practice/[materialId]/play

2. Tidak ada sesi aktif:
   GET /api/student/materials → daftar materi + progress%
   → Sort by order
   → Pilih materi pertama yang progress < 100%
   → Jika semua 100% → ulang dari materi pertama (mats[0])
   → POST /api/practice/start { materialId: nextMaterial.id }
   → Simpan response ke sessionStorage
   → redirect ke /student/practice/[materialId]/play
```

**Status tampilan:**
- `'checking'` → "Memeriksa sesi latihan…"
- `'starting'` → "Menyiapkan latihan… [info materi]"
- `'no_material'` → "📚 Belum ada materi — Guru belum menambahkan"
- `'error'` → Error message + tombol "Coba Lagi"

### 8.4 `/student/practice/[materialId]/play` — Gameplay Utama

**File**: `play/page.tsx` (802 baris) — komponen client-side penuh

**GameState Interface:**
```typescript
interface GameState {
  sessionId: string
  floor: number                  // Lantai saat ini (dari server)
  floorBeforeAnswer: number      // Lantai sebelum jawab (untuk modal)
  consecutiveWrong: number       // 0-3
  currentDifficulty: number      // 1-3
  difficultyLabel: string        // 'Mudah'|'Sedang'|'Sulit'
  question: QuestionForClient    // {id, materialId, difficulty, question, optA-E}
  materialId: string
  materialName: string
  selectedAnswer: string | null  // 'A'|'B'|'C'|'D'|'E'|null
  showCorrectModal: boolean
  showMustStudyModal: boolean
  isSubmitting: boolean
  currentHint: string | null
  stats: { floorsClimbed, correctAnswers, totalAttempts }
  streak: number                 // Consecutive correct answers
  sessionXP: number              // XP yang diraih sesi ini
  lastXPGain: number             // Untuk animasi floating +XP
}

const TOTAL_FLOORS = 10          // Setiap 10 lantai = 1 sesi "selesai"
```

**Inisialisasi Session:**
```
1. Baca sessionStorage.getItem('practiceSession')
   → Ada: restore gameState dari storage (termasuk streak, sessionXP)

2. Tidak ada:
   GET /api/practice/current
   → OK: simpan ke sessionStorage, buat gameState
   → Gagal: redirect ke /student/practice/[materialId]/start
```

**Auto-save Session State:**
- Setiap `gameState` berubah → `sessionStorage.setItem('practiceSession', JSON.stringify(state))`
- Menyimpan: sessionId, floor, consecutiveWrong, currentDifficulty, question, materialId, stats, streak, sessionXP

**Response Time Tracking:**
- `questionShownAtRef = useRef<number>(Date.now())`
- Diupdate setiap kali soal baru muncul
- Saat submit: `responseMs = Date.now() - questionShownAtRef.current`
- Dikirim ke server sebagai `responseMs` (untuk analisis kecepatan jawab siswa)

**Render Opsi Jawaban:**
```typescript
const options = [
  { key: 'A', text: gameState.question.optA },
  { key: 'B', text: gameState.question.optB },
  { key: 'C', text: gameState.question.optC },
  { key: 'D', text: gameState.question.optD },
  // optE hanya ditambahkan jika TIDAK kosong
  ...(gameState.question.optE ? [{ key: 'E', text: gameState.question.optE }] : []),
]
```
→ Grid 2-kolom. Selected = border cyan + glow shadow.

**handleSubmitAnswer:**
```
1. Hitung responseMs = Date.now() - questionShownAtRef.current
2. SET isSubmitting = true
3. POST /api/practice/answer { sessionId, questionId, answer, responseMs }
4. Response isCorrect === true:
   - setRobotState('celebrating')
   - fireConfetti()
   - Update gameState: floor++, streak++, sessionXP += xpGain, showCorrectModal = true
   - setShowXPFloat(true) → animasi +XP mengambang (1.2 detik)
   - Setelah 1.5 detik: setRobotState('climbing')
   - Setelah 0.8 detik lagi: setRobotState('idle')
     - Cek isSessionComplete: floor >= TOTAL_FLOORS+1 || !nextQuestion
     - Jika tidak complete: ganti soal baru, reset timer questionShownAtRef
     - Jika complete: handleEndSession('completed')

5. Response isCorrect === false:
   - showWrongFeedback → flash red overlay (600ms)
   - data.mustStudy: simpan ke sessionStorage 'studyMaterial', showMustStudyModal=true
   - !mustStudy: update soal baru + hint dari data.currentHint
```

**handleEndSession:**
```typescript
// Baca currentState, simpan ke sessionStorage 'practiceStats'
sessionStorage.setItem('practiceStats', JSON.stringify({
  floorsClimbed, correctAnswers, totalAttempts,
  sessionXP, bestStreak: streak,
  materialId, materialTitle: materialName
}))
sessionStorage.removeItem('practiceSession')

// Fire-and-forget: POST /api/practice/end
fetch('/api/practice/end', {
  method: 'POST',
  body: JSON.stringify({ sessionId, reason, stats, sessionXP })
}).catch(...)

// Navigate to complete page (tidak menunggu API response)
router.push('/student/practice/complete')
```

**UI Elements:**
- **Top Header**: Logo | Difficulty badge (Mudah/Sedang/Sulit dengan warna emerald/yellow/red) | Floor badge (Lantai N)
- **Progress Bar**: `(floor-1) / TOTAL_FLOORS × 100%`, gradient cyan→emerald dengan glow
- **Hint Banner** (muncul saat consecutiveWrong > 0): Amber card dengan icon `?`, bisa ditutup
- **Question Card** (GlassCard): Nama materi | Teks soal | Grid opsi jawaban
- **Wrong Indicator**: 3 dots merah `⬤ ⬤ ⬤` — merah = salah, abu = belum
- **Error Feedback**: Jika network error saat submit
- **Submit Button**: "Kirim Jawaban" (aktif setelah pilih) / "Memeriksa…" (saat loading)
- **Bottom Status Bar** (always fixed): `🔥/⚡/💫 Streak | ⭐ +XP sesi | [multiplier] | [Selesai]`
- **Modals**:
  - **Correct Modal**: Animasi spring, emoji 🎉, "Naik ke lantai N! 🚀", XP gained + streak multiplier
  - **Wajib Belajar Modal**: TIDAK bisa ditutup, 📚, "Pelajari Materi Sekarang" → `/student/materials/[materialId]`

**XP Multiplier Function (client-side untuk display):**
```typescript
function getXPMultiplier(streak: number): number {
  if (streak >= 10) return 3
  if (streak >= 5)  return 2
  if (streak >= 3)  return 1.5
  return 1
}
```

**Animasi Streak di Bottom Bar:**
- streak < 3 → emoji 💫 (abu/slate)
- streak 3-4 → emoji ⚡ (orange)
- streak 5+ → emoji 🔥 (orange bolder)
- ≥3: tampilkan multiplier `×1.5`, `×2`, `×3`

### 8.5 `/student/practice/complete` — Selesai Latihan

**Sumber data**: `sessionStorage.getItem('practiceStats')` (dihapus setelah dibaca)

**Komponen:**
- Confetti otomatis saat halaman load
- Motivational message berdasarkan accuracy:
  - ≥90%: "🌟 Luar Biasa!" 
  - ≥70%: "👏 Bagus Sekali!"
  - ≥50%: "💪 Semangat!"
  - <50%: "📚 Jangan Menyerah!"
- **4 StatPill**: XP Earned | Best Streak | Benar | Akurasi%
- **Ringkasan**: "Kamu menjawab X benar dari Y soal (Z salah)"
- **Tombol**: "Latihan Lagi" → `/student/practice/[materialId]/start` | "Kembali ke Dashboard"

### 8.6 `/student/practice/[materialId]/start` — Konfirmasi Mulai

Halaman konfirmasi sebelum mulai latihan baru (setelah dari complete atau manual).

### 8.7 `/student/test` — Halaman Daftar Tes

Semua materi aktif ditampilkan. Siswa memilih materi → pilih PRETEST atau POSTTEST.

### 8.8 `/student/test/[materialId]/[testType]` — Halaman Tes

**Server Component** (`page.tsx`) yang merender `StrictTestClient`.

**StrictTestClient** (`StrictTestClient.tsx`, 430 baris):

**State:**
```typescript
sessionId, questions, currentIndex, answers: Record<string, string>,
answeredIds: Set<string>, loading, error, startedAt,
timeLeft: 60*60 (3600 seconds), isTestFinished, saveStatus
```

**Inisialisasi:**
```
POST /api/test/start { materialId, testType }
→ sessionId, questions (tanpa correct/hints/explanation), answeredQuestionIds, startedAt
→ Jika TEST_ALREADY_COMPLETED → tampilkan "Tes Selesai"
```

**Timer:**
- Countdown dari 60 menit, dihitung dari `startedAt` (bukan dari waktu load)
- Warna timer:
  - Default: glass/putih
  - < 10 menit: yellow + border
  - < 5 menit: orange + border
  - < 1 menit: red + border + animate-pulse
- Saat habis: `handleAutoFinish()` → flush pending save → `finishSession()`

**Save Logic:**
- **PG**: `saveAnswer()` langsung saat opsi diklik
- **URAIAN**: debounce 1000ms, flush saat navigasi ke soal lain

**Navigation Sidebar** (hidden di mobile):
- Grid tombol bernomor
- Hijau (`bg-uni-primary/40`): sudah dijawab
- Putih scale-110: sedang aktif
- Abu: belum dijawab
- Tombol "Akhiri Ujian" di bawah

**Finish:**
- Confirm dialog "Apakah yakin?"
- Flush pending URAIAN save
- `POST /api/test/finish { sessionId }`
- `isTestFinished = true` → tampilkan halaman selesai

> **Catatan Bug**: Pada `StrictTestClient`, pilihan jawaban A-D di render hanya A-D (bukan A-E). Opsi E belum di-render di halaman tes (hanya di practice). Ini kemungkinan perlu diperbaiki.

### 8.9 `/student/leaderboard` — Papan Peringkat

**Data**: `GET /api/leaderboard?limit=20`

**getRankStyle():**
```typescript
function getRankStyle(rank: number) {
  if (rank === 1) return { bg:'from-yellow-400 to-yellow-600', text:'text-yellow-900', label:'#1', labelColor:'text-yellow-400' }
  if (rank === 2) return { bg:'from-gray-300 to-gray-500',     text:'text-gray-900',   label:'#2', labelColor:'text-gray-300' }
  if (rank === 3) return { bg:'from-orange-400 to-orange-600', text:'text-orange-900', label:'#3', labelColor:'text-orange-400' }
  return           { bg:'from-uni-primary/50 to-uni-accent/50', text:'text-white',      label:`#${rank}`, labelColor:'text-uni-primary' }
}
```

**Tiap baris leaderboard:**
- Rank circle (gradient) | Nama + badge terkini | "Kamu" label (jika user sendiri) | Lantai
- Row user sendiri: `ring-2 ring-uni-primary` highlight
- Akurasi juga ditampilkan di bawah nama

### 8.10 `/student/materials/[materialId]` — Materi Belajar / Wajib Belajar

Diakses saat siswa masuk "Wajib Belajar" setelah salah 3×. Juga bisa diakses manual.

**Fitur:**
- **3 Tab**: Ringkasan (SHORT) | Lengkap (FULL) | Video
- **Scroll tracking**: Lock/unlock tombol "Kembali Latihan" setelah scroll 80%
- **Minimum reading time**: Timer yang harus habis sebelum tombol unlock
- **Uji Pemahaman (Checkpoint)**: Soal MC dari `checkpointItems` JSON
  - Semua harus dijawab benar
  - Jawaban tidak dibahas (sesuai instruksi user: "siswa mencari tahu sendiri")
- **Sticky Bottom Bar**: Selalu di bawah, tidak menutupi konten
- **Wajib Belajar Message**: Pesan khusus yang ditampilkan saat masuk dari remedial

### 8.11 `/student/profile` — Profil Siswa

Statistik lengkap: XP total, badge, lantai total, akurasi, sesi, soal.
Progress per materi dalam list.
Link ke pengaturan.

### 8.12 `/student/achievements` — Pencapaian

List semua 13 achievement (dari tabel `achievements`). Highlight yang sudah diraih.

---

## 9. Halaman & Fitur — GURU

### 9.1 `/teacher/login` — Login Guru
Form email + password → `POST /api/auth/teacher/login`

### 9.2 `/teacher/register` — Registrasi Guru Baru
Form nama + email + password → `POST` (buat user TEACHER + teacher_profile)

### 9.3 `/teacher/forgot-password` & `/teacher/reset-password`
OTP via email (Resend). OTP expire, one-time use.

### 9.4 `/teacher/dashboard` — Dashboard Guru
- Stats: total siswa, total kelas, total sekolah, poin guru
- Data diambil server-side

### 9.5 `/teacher/schools` — Manajemen Sekolah
- Lihat sekolah milik guru
- Buat sekolah baru

### 9.6 `/teacher/classes` — Manajemen Kelas
- Buat kelas baru (pilih sekolah, nama kelas, kelas/grade)
- Lihat daftar murid di kelas
- Tambah/hapus murid dari kelas

### 9.7 `/teacher/students` — Manajemen Murid
- Lihat semua murid yang diajar
- Statistik per murid: floor, akurasi, sesi
- Daftarkan murid baru dengan NISN + nama
- Reset password murid
- Hapus murid dari kelas

### 9.8 `/teacher/reports` — Laporan
Laporan detail performa murid.

### 9.9 `/teacher/profile` — Profil Guru
Ubah nama, foto profil, password.

**Cara Guru Dapat Poin (Teacher Reward System):**
- Setiap `POST /api/practice/end` dengan `reason='completed'`:
  - Base: +1 poin ke `teacher_profiles.points`
  - Bonus: +2 poin jika akurasi murid ≥ 80%
- Cara lookup guru: `student → classStudents → classes → schools.ownerTeacherId`

---

## 10. Halaman & Fitur — ADMIN

### 10.1 `/admin/login` — Login Admin
Email + password → `POST /api/auth/admin/login`

### 10.2 `/admin/dashboard` — Dashboard Admin
Overview semua statistik sistem: user count, materi, soal, sesi aktif.

### 10.3 `/admin/users` — Manajemen Pengguna

**Operasi:**
- `GET /api/admin/users` → list semua guru + siswa dengan stats
  - **Optimasi N+1**: Query siswa dengan 2 batch GROUP BY, bukan N query per siswa
- `POST /api/admin/users` → buat user baru (guru: nama+email+password / siswa: nama+NISN)
- `PATCH /api/admin/users` → update nama/email/NISN **atau** reset password (generate 8 char random)
- `DELETE /api/admin/users` → hapus user (gagal jika ada FK constraint)

### 10.4 `/admin/materials` — Manajemen Materi

**Operasi:**
- `GET /api/admin/materials` → list semua materi + jumlah soal per materi
- `POST /api/admin/materials` → buat materi baru
- `PATCH /api/admin/materials` → update materi (judul, URL, konten)
- `DELETE /api/admin/materials` → hapus materi

Termasuk editor untuk:
- Judul, deskripsi, grade, order
- URL PDF (summaryUrl, fullUrl), URL video
- Konten markdown (bodyMarkdown)
- Learning objectives, common mistakes, remedial text

### 10.5 `/admin/questions` — Manajemen Soal

**Operasi:**
- `GET /api/admin/questions?materialId=X` → list soal per materi dengan semua field
- `DELETE /api/admin/questions?materialId=X` → hapus SEMUA soal per materi
- `POST /api/admin/questions/upload` (multipart/form-data) → upload CSV
- `GET /api/admin/questions/template` → download template CSV

**Upload CSV — 3 Format yang Didukung:**
1. **vExport (20 kolom)** — hasil export dari admin panel, multi-materi:
   ```
   id, materialId, judulMateri, mode, indicator, difficulty, difficultyLabel,
   questionType, question, optA, optB, optC, optD, optE, correct,
   hint1, hint2, hint3, explanation, remedialMaterialId
   ```
   → `materialId` dibaca dari CSV per baris (bisa beda-beda materi dalam 1 file)

2. **v2 (16 kolom)** — template dengan optE:
   ```
   mode, indicator, difficulty, questionType, question,
   optA, optB, optC, optD, optE, correct,
   hint1, hint2, hint3, explanation, remedialMaterialId
   ```
   → Butuh pilih `materialId` dari dropdown

3. **v1 (15 kolom)** — format lama tanpa optE:
   ```
   mode, indicator, difficulty, questionType, question,
   optA, optB, optC, optD, correct,
   hint1, hint2, hint3, explanation, remedialMaterialId
   ```
   → `optE` otomatis diset `''`

**Validasi Nilai CSV:**
- mode: `PRACTICE`, `PRETEST`, `POST_TEST`, `POSTTEST`, `ALL`
- difficulty: `1`, `2`, `3`, `MUDAH`, `EASY`, `SEDANG`, `MEDIUM`, `SULIT`, `HARD`
- questionType: `PG`, `PILIHAN GANDA`, `PILIHAN_GANDA`, `URAIAN`, `ESSAY`
- indicator: `I1`, `I2`, `I3`, `I4`
- correct: `A`, `B`, `C`, `D`, `E`

**Deduplication:**
- Key: `materialId || mode.toLowerCase() || question.toLowerCase()`
- Cek duplikat dalam file + duplikat dengan DB yang sudah ada
- Duplikat dalam file → skip (warning)
- Duplikat dengan DB → error (tidak di-insert)

**Dry Run Mode:**
- `dryRun=1` di form data → preview 5 baris pertama tanpa insert

**Batch Insert:** 50 soal per batch untuk menghindari timeout SQLite.

### 10.6 `/admin/achievements` — Manajemen Achievement
CRUD achievement (nama, deskripsi, icon, type, requirement, points).

### 10.7 `/admin/reports` — Laporan
Tampilkan data riset/penelitian.

### 10.8 Admin Export APIs

**`GET /api/admin/export/practice`** (query params: `studentId`, `materialId`):
- Ambil data latihan lengkap per siswa
- Join: users + classStudents + classes + practiceSessions + practiceAttempts + questions + materials
- Format CSV: Nama Siswa, Kelas, Materi, Lantai, Soal, Jawaban, Benar/Salah, Waktu Respons, XP, dll.
- **Optimasi N+1**: Map studentId → className di memori (bukan JOIN yang menghasilkan duplikat)

---

## 11. Semua API Endpoints (30+)

### Authentication
| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| POST | `/api/auth/student/check-nisn` | Public | Cek NISN, return passwordStatus |
| POST | `/api/auth/student/login` | Public | Login siswa |
| POST | `/api/auth/student/set-password` | Public | Set password pertama kali |
| POST | `/api/auth/student/change-password` | Student | Ganti password |
| POST | `/api/auth/student/register` | Public | Daftar siswa baru |
| POST | `/api/auth/student/reset-password` | Admin/Teacher | Reset password siswa |
| POST | `/api/auth/teacher/login` | Public | Login guru |
| POST | `/api/auth/teacher/forgot-password` | Public | Kirim OTP reset password |
| POST | `/api/auth/teacher/reset-password` | Public | Reset password dengan OTP |
| POST | `/api/auth/admin` | Public | Login admin |
| GET | `/api/auth/me` | Any | Validasi token, return user |
| POST | `/api/auth/logout` | Any | Revoke token |
| POST | `/api/auth/profile` | Any | Update profil (nama, avatar) |

### Practice (Core Gameplay)
| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| POST | `/api/practice/start` | Student | Mulai/resume sesi. Body: `{materialId?}` |
| GET | `/api/practice/current` | Student | Ambil soal dari sesi aktif |
| POST | `/api/practice/answer` | Student | Submit jawaban. Body: `{sessionId, questionId, answer, responseMs}` |
| POST | `/api/practice/end` | Student | Akhiri sesi. Body: `{sessionId, reason, stats, sessionXP}` |

### Test (Pretest/Posttest)
| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| POST | `/api/test/start` | Student | Mulai tes. Body: `{materialId, testType}` |
| POST | `/api/test/answer` | Student | Simpan jawaban. Body: `{sessionId, questionId, answer}` |
| POST | `/api/test/finish` | Student | Selesai tes. Body: `{sessionId}` |

### Student APIs
| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/student/progress` | Student | XP, currentMaterial, currentFloor |
| GET | `/api/student/stats` | Student | totalFloors, accuracy, rank, totalSessions |
| GET | `/api/student/materials` | Student | List materi + progress% |
| GET | `/api/student/materials/[id]` | Student | Detail satu materi |
| GET | `/api/student/materials/[id]/content` | Student | Konten SHORT/FULL/VIDEO |
| GET | `/api/student/achievements` | Student | Achievement yang sudah diraih |
| GET | `/api/student/report` | Student | Laporan detail |

### Leaderboard
| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/leaderboard` | Public | Query param: `limit=20&classId=X` |

### Teacher APIs
| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET/POST | `/api/teacher/students` | Teacher | Daftar murid + stats |
| GET/POST/DELETE | `/api/teacher/classes` | Teacher | Kelola kelas |
| GET/POST | `/api/teacher/schools` | Teacher | Kelola sekolah |

### Admin APIs
| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET/POST/PATCH/DELETE | `/api/admin/users` | Admin | CRUD user |
| GET/POST/PATCH/DELETE | `/api/admin/materials` | Admin | CRUD materi |
| GET/DELETE | `/api/admin/questions` | Admin | List/hapus soal per materi |
| POST | `/api/admin/questions/upload` | Admin | Upload CSV soal |
| GET | `/api/admin/questions/template` | Admin | Download template CSV |
| GET/POST/PATCH/DELETE | `/api/admin/achievements` | Admin | CRUD achievement |
| GET | `/api/admin/export/practice` | Admin | Export data latihan ke CSV |
| GET | `/api/admin/export/research` | Admin | Export data riset ke CSV |

---

## 12. Logika Gameplay Penuh (Practice)

### 12.1 POST /api/practice/start — Detail Lengkap

```typescript
// Auth resolution priority:
// 1. Authorization: Bearer {token}
// 2. Cookie 'auth_token'
// 3. Cookie 'token' (client-set)
// 4. Cookie 'user' (legacy)

// Jika materialId tidak diberikan → ambil materials[0] by order

// === CEK SESI YANG ADA ===
existingSessions = db.select().from(practiceSessions)
  .where(studentUserId=userId AND materialId=X AND status IN ('ACTIVE','REMEDIAL_REQUIRED'))
  .orderBy(startedAt DESC).limit(1)

if (existingSessions.length > 0) {
  session = existingSessions[0]
  
  // Coba ambil currentQuestion dari session
  if (session.currentQuestionId) {
    currentQuestion = db.select().from(questions).where(id=currentQuestionId)
  }
  
  // Jika tidak ada (misal setelah remedial):
  if (!currentQuestion) {
    usedIds = db.select(questionId).from(practiceAttempts).where(sessionId=session.id)
    currentQuestion = getNewQuestion(materialId, session.currentDifficulty, usedIds)
    db.update(practiceSessions).set({currentQuestionId, status:'ACTIVE', consecutiveWrong:0})
  }
  
  return { sessionId, materialId, materialName, floor, consecutiveWrong,
    currentDifficulty, currentStreak, mode:'practice', question, stats, resumed:true }
}

// === SESI BARU ===
// Ambil lantai tertinggi yang pernah dicapai di material ini
startingFloor = MAX(floor) FROM practiceSessions 
  WHERE studentUserId=userId AND materialId=materialId
  COALESCE → 1 jika belum ada sesi

firstQuestion = random dari soal difficulty=2 (SEDANG) yang ada
  → fallback: any question untuk material ini

sessionId = 'session_' + Date.now() + '_' + random9char
db.insert(practiceSessions).values({ id:sessionId, studentUserId, materialId,
  floor:startingFloor, consecutiveWrong:0, currentDifficulty:2, currentStreak:0,
  currentQuestionId:firstQuestion.id, startedAt:now, status:'ACTIVE' })

return { sessionId, materialId, materialName, floor:startingFloor, consecutiveWrong:0,
  currentDifficulty, currentStreak:0, mode:'practice', question, stats:{floorsClimbed:startingFloor-1,...} }
```

### 12.2 POST /api/practice/answer — Detail Lengkap

```typescript
// Validasi input
if (!sessionId || !questionId || !answer) → 400
if (!['A','B','C','D','E'].includes(answer.toUpperCase())) → 400

// Ambil question (untuk cek correct answer)
question = db.select().from(questions).where(id=questionId)

// Ambil session
session = db.select().from(practiceSessions).where(id=sessionId)

isCorrect = (answer === question.correct)

// Kumpulkan soal yang sudah dipakai (limit 100 untuk performa)
usedQuestionIds = db.select(questionId).from(practiceAttempts)
  .where(sessionId=sessionId).limit(100)
usedQuestionIds.push(questionId) // exclude current

attemptId = 'attempt_' + Date.now() + '_' + random9char

// ====================================================
// KASUS 1: JAWABAN BENAR
// ====================================================
if (isCorrect) {
  newFloor = session.floor + 1
  newStreak = (session.currentStreak || 0) + 1
  multiplier = getXPMultiplier(newStreak)  // 1/1.5/2/3
  xpGain = Math.round(10 * multiplier)
  
  nextDifficulty = clamp(session.currentDifficulty + 1, 1, 3)
  nextQ = getNewQuestion(session.materialId, nextDifficulty, usedQuestionIds)
  
  // RETRY (exponential backoff 100/200/400ms untuk SQLITE_BUSY):
  withRetry → db.insert(practiceAttempts).values({...isCorrect:true, xpAwarded:xpGain, floor:session.floor})
  withRetry → db.update(practiceSessions).set({floor:newFloor, consecutiveWrong:0, 
    currentStreak:newStreak, currentDifficulty:nextQ?.difficulty || nextDifficulty,
    currentQuestionId:nextQ?.id})
  withRetry → db.update(users).set({totalPoints: sql`COALESCE(total_points,0) + ${xpGain}`})
  
  return { isCorrect:true, floor:newFloor, consecutiveWrong:0, currentStreak:newStreak,
    currentDifficulty, difficultyLabel, nextQuestion, xpGain }
}

// ====================================================
// KASUS 2a: SALAH (consecutive < 3)
// ====================================================
withRetry → db.insert(practiceAttempts).values({...isCorrect:false, xpAwarded:0})

newConsecutiveWrong = session.consecutiveWrong + 1
nextDifficulty = clamp(session.currentDifficulty - 1, 1, 3)

if (newConsecutiveWrong < 3) {
  nextQ = getNewQuestion(session.materialId, nextDifficulty, usedQuestionIds)
  withRetry → db.update(practiceSessions).set({consecutiveWrong:newConsecutiveWrong,
    currentStreak:0, currentDifficulty, currentQuestionId:nextQ?.id})
  
  // Hint berdasarkan consecutiveWrong:
  // 1× salah → nextQ.hint1
  // 2× salah → nextQ.hint2
  currentHint = newConsecutiveWrong === 1 ? nextQ?.hint1 
              : newConsecutiveWrong === 2 ? nextQ?.hint2 
              : null
  
  return { isCorrect:false, floor:session.floor, consecutiveWrong:newConsecutiveWrong,
    currentDifficulty, difficultyLabel, nextQuestion, currentHint }
}

// ====================================================
// KASUS 2b: SALAH 3× BERTURUT = WAJIB BELAJAR
// ====================================================
withRetry → db.update(practiceSessions).set({status:'REMEDIAL_REQUIRED',
  consecutiveWrong:newConsecutiveWrong, currentStreak:0, 
  currentDifficulty:nextDifficulty, currentQuestionId:null})

return { isCorrect:false, floor:session.floor, consecutiveWrong:newConsecutiveWrong,
  mustStudy:true, materialId, materialName, explanation:question.explanation,
  message:'Kamu sudah salah menjawab 3 kali berturut-turut. Yuk pelajari materi dulu!' }
```

### 12.3 getNewQuestion() — Algoritma Pemilihan Soal

```typescript
// Satu query: ambil semua soal PRACTICE untuk materi ini
allQuestions = db.select().from(questions)
  .where(materialId=X AND mode IN ('PRACTICE','ALL'))

// Filter di memori (zero additional DB calls):

// 1. Target difficulty + belum dipakai
atTargetUnused = allQuestions.filter(q => q.difficulty===difficulty && !excludeSet.has(q.id))
if (atTargetUnused.length > 0) return random(atTargetUnused)

// 2. Any unused (any difficulty)
anyUnused = allQuestions.filter(q => !excludeSet.has(q.id))
if (anyUnused.length > 0) return random(anyUnused)

// 3. Repeat allowed: target difficulty (reset rotasi)
atTarget = allQuestions.filter(q => q.difficulty===difficulty)
if (atTarget.length > 0) return random(atTarget)

// 4. Any question (absolute fallback)
return random(allQuestions)
```

### 12.4 POST /api/practice/end — Detail Lengkap

```typescript
// Ambil session
session = db.select().from(practiceSessions).where(id=sessionId)

// Hitung stats dari attempts
attemptStats = db.select({
  totalAttempts: count(*),
  correctAnswers: sum(case when is_correct=1 then 1 else 0 end)
}).from(practiceAttempts).where(sessionId=sessionId)

// Update status session
db.update(practiceSessions).set({
  status: reason==='completed' ? 'COMPLETED' : 'ABANDONED',
  endedAt: now
})

// Award teacher points jika completed
if (reason === 'completed') {
  teacherPoints = 1  // base
  accuracy = correctAnswers / totalAttempts * 100
  if (accuracy >= 80) teacherPoints += 2  // bonus akurasi tinggi
  
  // Lookup guru: student → classStudents → classes → schools.ownerTeacherId
  await awardTeacherPoints(session.studentUserId, teacherPoints)
}

// Ambil total XP terkini dari DB
totalXP = db.select(totalPoints).from(users).where(id=session.studentUserId)

return { success:true, totalXP, stats:{floorsClimbed, correctAnswers, totalAttempts} }
```

---

## 13. Logika Tes (Pretest/Posttest)

### POST /api/test/start

```typescript
// Auth: Bearer token atau cookie 'token' → role harus STUDENT

// Validasi: materialId && ['PRETEST','POSTTEST'].includes(testType)

// Cek existing session
existing = db.select().from(testSessions)
  .where(studentUserId=X AND materialId=X AND testType=X)

if (existing[0]?.completedAt) → return 403 TEST_ALREADY_COMPLETED

if (!existing[0]) {
  // Buat session baru
  id = 'test_' + Date.now() + '_' + random9char
  db.insert(testSessions).values({id, studentUserId, materialId, testType, startedAt:now})
}

// Ambil soal
allQuestions = db.select().from(questions)
  .where(materialId=X AND mode=testType)  // misal mode='PRETEST'
// Fallback jika tidak ada soal dengan mode spesifik:
if (allQuestions.length === 0) {
  allQuestions = db.select().from(questions).where(materialId=X AND mode='ALL')
}

// Strip semua data sensitif dari soal!
testQuestions = allQuestions.map(q => {
  const { correct, hint1, hint2, hint3, explanation, remedialMaterialId, ...safeQuestion } = q
  return safeQuestion
})

// Ambil jawaban yang sudah disimpan (untuk resume)
attempts = db.select().from(testAttempts).where(sessionId=session.id)

return { sessionId, startedAt, questions:testQuestions, answeredQuestionIds:attempts.map(a=>a.questionId) }
```

### POST /api/test/answer

```typescript
{ sessionId, questionId, answer } = await request.json()

// Cek soal
[question] = db.select().from(questions).where(id=questionId)

// Auto-grade jika PG
isCorrect = question.questionType !== 'URAIAN' 
  ? (answer === question.correct) 
  : null  // URAIAN tidak auto-grade

// Simpan atau update attempt (upsert logic)
attemptId = 'tattempt_' + Date.now() + '_' + random
db.insert(testAttempts).values({ id:attemptId, sessionId, questionId, answer, isCorrect, createdAt:now })
```

### POST /api/test/finish

```typescript
{ sessionId } = await request.json()
db.update(testSessions).set({ completedAt: new Date().toISOString() }).where(id=sessionId)
return { success: true }
```

---

## 14. XP & Badge System

### XP Economy (Server-Authoritative)

```
XP hanya diperoleh dari jawaban benar di latihan.
XP tidak berkurang.
XP langsung di-update ke users.totalPoints SETIAP jawaban benar (bukan hanya saat selesai).
```

**Formula XP:**
```
BASE_XP = 10
multiplier = getXPMultiplier(streak)
xpGain = Math.round(BASE_XP * multiplier)
```

**Streak Multiplier:**
```
streak 0-2  → ×1   = 10 XP
streak 3-4  → ×1.5 = 15 XP
streak 5-9  → ×2   = 20 XP
streak 10+  → ×3   = 30 XP
```

**Streak di reset ke 0 saat:**
- Jawaban salah
- Masuk Wajib Belajar

**Streak TIDAK di-reset saat:**
- Selesai sesi (lanjut di sesi berikutnya jika resume)

### Badge System (Client-Side Calculation)

Badge dihitung di client dari `users.totalPoints` (total XP):

```typescript
// Threshold Badge:
Starter:  0   - 29 XP  → ⭐ (slate-400)
Bronze:   30  - 79 XP  → 🥉 (orange-400)
Silver:   80  - 149 XP → 🥈 (gray-300)
Gold:     150 - 299 XP → 🏅 (amber-400)
Diamond:  300 - 499 XP → 💎 (cyan-300)
Master:   500+ XP       → 👑 (yellow-300)
```

### Leaderboard Ranking

```typescript
// Sort by:
// 1. users.totalPoints DESC (primary — XP lebih tinggi = rank lebih baik)
// 2. totalFloors DESC (tiebreaker — floor lebih tinggi jika XP sama)

// totalFloors = MAX(floor) dari semua practice_sessions siswa
```

**Rank Display:**
- `#1` → background gradient yellow → ring emas
- `#2` → background gradient gray → ring perak
- `#3` → background gradient orange → ring perunggu
- `#4+` → background gradient uni-primary/uni-accent → ring biru

---

## 15. Format Soal & CSV Import

### Struktur Soal Lengkap

```typescript
interface Question {
  id:                string   // "Q1abcd_0_xy" (format auto-generated)
  materialId:        string   // "M1A", "R1", dll
  mode:              'PRACTICE' | 'PRETEST' | 'POSTTEST' | 'ALL'
  indicator:         'I1' | 'I2' | 'I3' | 'I4'
  difficulty:        1 | 2 | 3    // 1=Mudah, 2=Sedang, 3=Sulit
  questionType:      'PG' | 'URAIAN'
  question:          string   // Teks soal
  optA:              string   // Pilihan A
  optB:              string   // Pilihan B
  optC:              string   // Pilihan C
  optD:              string   // Pilihan D
  optE:              string   // Pilihan E ('' jika tidak ada)
  correct:           'A' | 'B' | 'C' | 'D' | 'E'
  hint1:             string | null  // Muncul setelah salah 1×
  hint2:             string | null  // Muncul setelah salah 2×
  hint3:             string | null  // (jarang digunakan di UI)
  explanation:       string | null  // Muncul di Wajib Belajar modal
  remedialMaterialId: string | null // ID materi remedial terkait
}
```

### Format CSV Import v2 (Standar) — 16 Kolom

```csv
mode,indicator,difficulty,questionType,question,optA,optB,optC,optD,optE,correct,hint1,hint2,hint3,explanation,remedialMaterialId
PRACTICE,I1,MUDAH,PG,"Toko memberikan diskon 20%. Harga awal Rp50.000. Harga akhir?",Rp35.000,Rp40.000,Rp45.000,Rp30.000,Rp42.000,B,"Diskon = persentase × harga","20% × 50000 = 10000","50000 - 10000 = 40000","Jawaban: Rp40.000",R1
ALL,I2,SULIT,PG,"PPN 11%. Harga barang Rp200.000. Total bayar?",Rp210.000,Rp211.000,Rp222.000,Rp220.000,Rp215.000,C,"PPN = 11% × harga","11% × 200000 = 22000","200000 + 22000 = 222000","Jawaban: Rp222.000",R2
```

### Format CSV Export (Admin) — 20 Kolom

```csv
id,materialId,judulMateri,mode,indicator,difficulty,difficultyLabel,questionType,question,optA,optB,optC,optD,optE,correct,hint1,hint2,hint3,explanation,remedialMaterialId
Q1abc_0_xy,M1A,Diskon & Harga Akhir,PRACTICE,I1,1,Mudah,PG,"Soal...",A,B,C,D,E,B,hint1,hint2,hint3,expl,R1
```

### Deduplication Algorithm

```typescript
// Key unik: materialId + mode + question text (lowercase)
const dedupeKey = `${materialId}||${mode.toLowerCase()}||${question.toLowerCase()}`

// Cek duplikat dalam file CSV yang sedang diupload
if (seenInFile.has(dedupeKey)) → skip (warning, bukan error)

// Cek duplikat dengan DB yang sudah ada
if (existingSet.has(dedupeKey)) → ERROR (hentikan seluruh upload!)

// Kalau valid:
seenInFile.add(dedupeKey)
rowsToInsert.push(...)
```

### Indikator (I1-I4)

| Kode | Makna (Kontekstual) |
|------|---------------------|
| I1 | Menghitung diskon / persen potongan harga |
| I2 | Menghitung PPN, biaya layanan, pajak |
| I3 | Menghitung untung/rugi, persentase keuntungan |
| I4 | Menghitung bunga sederhana, bruto/neto/tara |

---

## 16. Komponen UI Reusable

Semua di `src/components/ui/`:

### GlassCard
```typescript
interface GlassCardProps {
  children: ReactNode
  className?: string
  glowColor?: 'cyan' | 'emerald' | 'amber' | 'red' | 'violet'
  intensity?: 'normal' | 'strong'
  onClick?: () => void
}
```
- Background: `bg-[rgba(7,17,36,0.75)]` + `backdrop-blur-xl`
- Border: `border border-white/10`
- Hover glow effect per warna

### NeonButton
```typescript
interface NeonButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  // ... standard button props
}
```

### StarryBackground
- Animasi bintang berkedip dengan CSS keyframes
- `density?: 'low' | 'medium' | 'high'`
- Pure CSS, tidak pakai canvas/WebGL

### TowerBackground
```typescript
interface TowerBackgroundProps {
  variant?: 'landing' | 'practice' | 'teacher' | 'admin'
}
```
- SVG gedung bertingkat
- Background gradient sesuai tema

### RobotMascot
```typescript
interface RobotMascotProps {
  state?: 'idle' | 'waving' | 'happy' | 'thinking' | 'worried' | 'climbing' | 'celebrating'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

### LoadingScreen
```typescript
interface LoadingScreenProps {
  fullScreen?: boolean   // default: true
  message?: string
}
```

### Modal
Standard modal dengan overlay dark, animasi spring, close on overlay click.

### Toast
Notifikasi sementara: `success | error | warning`. Auto-dismiss setelah 3 detik.

### ProgressBar
```typescript
interface ProgressBarProps {
  value: number   // 0-100
  color?: 'cyan' | 'emerald' | 'amber'
  animated?: boolean
  showLabel?: boolean
}
```

### SettingsPanel
Panel pengaturan yang bisa digeser dari bawah (slide-up). Berisi:
- Toggle dark/light mode
- Pilih font size (kecil/sedang/besar)
- Toggle background music (BGM)

---

## 17. State Management & Session Storage

### localStorage Keys
| Key | Value | Kapan dihapus |
|-----|-------|---------------|
| `unimath_token` | Token string | Logout |
| `unimath_user` | JSON User | Logout |
| `unimath_onboarding_seen` | `'true'` | Tidak dihapus (permanen) |

### sessionStorage Keys
| Key | Value | Kapan dihapus |
|-----|-------|---------------|
| `practiceSession` | GameState JSON | handleEndSession() atau expired |
| `practiceStats` | Stats JSON | Dibaca di complete page, langsung dihapus |
| `studyMaterial` | `{materialId, materialName}` JSON | Tidak dihapus otomatis |

**practiceSession JSON:**
```json
{
  "sessionId": "session_...",
  "floor": 5,
  "consecutiveWrong": 0,
  "currentDifficulty": 2,
  "difficultyLabel": "Sedang",
  "question": { "id":..., "question":..., "optA":..., "optB":..., "optC":..., "optD":..., "optE":... },
  "materialId": "M1A",
  "materialName": "Diskon & Harga Akhir",
  "stats": { "floorsClimbed": 4, "correctAnswers": 3, "totalAttempts": 5 },
  "streak": 2,
  "sessionXP": 25
}
```

**practiceStats JSON:**
```json
{
  "floorsClimbed": 5,
  "correctAnswers": 4,
  "totalAttempts": 6,
  "sessionXP": 35,
  "bestStreak": 3,
  "materialId": "M1A",
  "materialTitle": "Diskon & Harga Akhir"
}
```

### Cookies (HTTP, max-age 7 hari)
| Cookie | Value | Set oleh |
|--------|-------|---------|
| `user` | JSON User | AuthContext.login() (document.cookie) |
| `token` | Token string | AuthContext.login() (document.cookie) |
| `maintenance_bypass` | bypass key | Middleware (server-set, httpOnly, 8 jam) |

---

## 18. Performa & Optimasi Database

### Retry Mechanism (SQLite BUSY)

```typescript
// Dipakai di practice/answer untuk semua write operations
async function withRetry<T>(fn: () => Promise<T>, maxRetries=3, delayMs=100): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await fn() }
    catch (err) {
      const isRetryable = errMsg.includes('SQLITE_BUSY') 
        || errMsg.includes('database is locked')
        || errMsg.includes('timeout')
        || errMsg.includes('BLOCKED')
      if (attempt === maxRetries || !isRetryable) throw err
      // Exponential backoff: 100ms, 200ms, 400ms
      await sleep(delayMs * attempt)
    }
  }
}
```

### N+1 Query Elimination

**Admin users list:**
```typescript
// BURUK (N+1):
for (const student of students) {
  const stats = await db.query.stats(student.id)  // N queries!
}

// BAIK (2 batch queries):
const allStats = await db
  .select({ studentId, MAX(floor), COUNT(*), SUM(isCorrect) })
  .from(practiceSessions)
  .groupBy(studentUserId)

const statsMap: Record<string, stats> = {}
for (const s of allStats) statsMap[s.studentUserId] = s

// Join di memori
students.map(s => ({ ...s, stats: statsMap[s.id] || defaultStats }))
```

**Admin export practice:**
```typescript
// Duplikat dari JOIN classStudents (satu siswa bisa di banyak kelas)
// Solusi: query terpisah, ambil hanya kelas pertama per siswa
const studentClassRows = await db.select({studentUserId, className})
  .from(classStudents).innerJoin(classes, ...)

const classMap: Record<string, string> = {}
for (const r of studentClassRows) {
  if (!classMap[r.studentUserId]) classMap[r.studentUserId] = r.className
}
```

### Optimasi getNewQuestion (Single Query)

```typescript
// BURUK (3-4 queries):
// 1. query difficulty=target, exclude used
// 2. fallback: any unused
// 3. fallback: allow repeats

// BAIK (1 query + filter memori):
const allQ = await db.select().from(questions)
  .where(materialId=X AND mode IN ('PRACTICE','ALL'))
// Filter semua kasus di JavaScript — lebih cepat dari 3 DB round-trips
```

### Limit Attempt Query

```typescript
// Batasi query attempt untuk rotasi soal (tidak perlu semua historis)
const usedAttempts = await db.select({questionId})
  .from(practiceAttempts)
  .where(sessionId=sessionId)
  .limit(100)   // Cukup 100 — lebih dari cukup per sesi
```

### Semua Indeks Database (20 Indeks)

| Nama Indeks | Tabel | Kolom | Dipakai Di |
|-------------|-------|-------|-----------|
| users_role_idx | users | role | Admin user list |
| users_nisn_idx | users | nisn | Login siswa (check-nisn) |
| class_students_student_idx | class_students | studentUserId | Lookup kelas siswa |
| class_students_class_idx | class_students | classId | List murid di kelas |
| questions_material_difficulty_idx | questions | materialId, difficulty, mode | **SETIAP jawaban siswa** |
| questions_material_idx | questions | materialId | List soal per materi |
| practice_sessions_student_status_idx | practice_sessions | studentUserId, status | **SETIAP halaman latihan** |
| practice_sessions_student_material_idx | practice_sessions | studentUserId, materialId | Start/resume sesi |
| practice_sessions_student_idx | practice_sessions | studentUserId | Stats agregat |
| practice_attempts_session_idx | practice_attempts | sessionId | **SETIAP submit jawaban** |
| practice_attempts_session_correct_idx | practice_attempts | sessionId, isCorrect | Export admin |
| test_sessions_student_type_idx | test_sessions | studentUserId, testType | Cek tes existing |
| test_attempts_session_idx | test_attempts | sessionId | Ambil jawaban tes |
| auth_tokens_user_id_idx | auth_tokens | userId | Revoke semua token user |

---

## 19. Keamanan Sistem

### Password Hashing
```typescript
// bcryptjs, 10 salt rounds
bcrypt.hash(password, 10)

// Legacy support (migrasi dari plain text):
if (password.startsWith('$2')) {
  // bcrypt hash → bcrypt.compare()
} else {
  // plain text (legacy) → direct comparison
}
```

### Token Security
- Format: `{role}_{userId}_{timestamp}_{random12char}`
- Disimpan di `auth_tokens` table dengan `expires_at`
- **Tidak ada JWT** — setiap request hit database
- Token expire 7 hari
- Revoke semua token user saat reset password: `DELETE FROM auth_tokens WHERE user_id = ?`

### Answer Security
**Soal yang dikirim ke client TIDAK mengandung:**
```typescript
// Di practice/start dan practice/current:
function formatQuestionForClient(q) {
  return {
    id, materialId, difficulty, difficultyLabel,
    question, optA, optB, optC, optD, optE
    // ❌ correct TIDAK dikirim
    // ❌ hint1, hint2, hint3 TIDAK dikirim
    // ❌ explanation TIDAK dikirim
    // ❌ remedialMaterialId TIDAK dikirim
  }
}

// Di test/start:
const { correct, hint1, hint2, hint3, explanation, remedialMaterialId, ...safeQuestion } = q
return safeQuestion
```

### Admin Authorization
```typescript
async function validateAdmin(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = await validateToken(token)
  if (!tokenData.valid || tokenData.role !== 'ADMIN') return null
  return tokenData
}
```

### Maintenance Mode Bypass
- Bypass via query param: `?bypass=unimath-admin-2026`
- Setelah bypass, cookie `maintenance_bypass` di-set (httpOnly, 8 jam)
- Bypass key dari env var `MAINTENANCE_BYPASS_KEY` (default: `unimath-admin-2026`)

---

## 20. Environment Variables

```env
# === DATABASE ===
TURSO_DATABASE_URL=libsql://your-db-name.turso.io   # URL database Turso
TURSO_AUTH_TOKEN=eyJhb...                             # Auth token Turso

# === EMAIL (untuk OTP reset password guru) ===
RESEND_API_KEY=re_xxxxxxxxxxxx                        # API key Resend

# === MAINTENANCE MODE ===
NEXT_PUBLIC_MAINTENANCE_MODE=false   # Set 'true' untuk aktifkan maintenance
MAINTENANCE_BYPASS_KEY=unimath-admin-2026  # Key bypass maintenance

# === NEXT.JS ===
# (Tidak ada NEXTAUTH_SECRET karena tidak pakai NextAuth)
```

**File konfigurasi Drizzle (`drizzle.config.ts`):**
```typescript
export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
  }
}
```

**Database Client (`src/lib/db/client.ts`):**
```typescript
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
})

export const db = drizzle(client)
```

---

## 21. Semua Database Scripts (CLI)

### Seed Data Awal (`seed.ts`)
Membuat:
- 1 akun Admin (email: admin@unimath.id)
- Beberapa akun Guru demo
- Beberapa akun Siswa demo (passwordStatus: UNSET)
- Sekolah demo + Kelas demo
- Materi M1A–M1F + R1–R3 (tanpa soal)

### Seed Achievements (`seed-achievements.ts`)
Insert 13 achievement ke tabel `achievements` (ACH001–ACH013).

### Import Practice Questions (`import-practice.ts`)
Baca CSV dari `bank-soal-final/` satu per satu:
- `M1A_DISKON_HARGA_AKHIR.csv` → mode=PRACTICE, materialId=M1A
- `M1B_...csv` → mode=PRACTICE, materialId=M1B
- dst.

### Import Master Practice (`import-master-practice.ts`)
Import dari single master CSV yang berisi soal semua materi (450+ soal).

### Import Material Contents (`import-material-contents.ts`)
Import konten materi (learning objectives, formulas, examples, dll.) dari CSV.

### Update Checkpoints (`update-checkpoints.ts`)
Update `checkpointItems` di `material_contents` dari file CSV checkpoint.

### Seed Materials Content (`seed-materials-content.ts`)
Insert konten teks materi (conceptText, formulas, steps, examples) hardcoded ke DB.

### Generate Test Questions (`generate-test-questions.ts`)
Ambil soal PRACTICE yang ada, lalu buat soal PRETEST dan POSTTEST dari sebagian soal tersebut (ubah `mode` → duplikat + insert baru).

---

## 22. Alur Lengkap User Journey

### Journey 1: Siswa Baru (First-Time)

```
[1] Admin/Guru daftarkan siswa (NISN + nama)
     → DB: users(role=STUDENT, nisn, passwordStatus='UNSET')
     → DB: class_students (siswa masuk kelas)

[2] Siswa buka UniMath → Landing page
     → Klik "Login Siswa"

[3] Masukkan NISN
     → POST /api/auth/student/check-nisn
     → Return: { exists: true, passwordStatus: 'UNSET' }
     → Client: tampilkan form "Set Password"

[4] Siswa masukkan password baru + konfirmasi
     → POST /api/auth/student/set-password { nisn, password }
     → DB: UPDATE users SET password=hash, passwordStatus='SET'
     → DB: INSERT auth_tokens
     → Client: login() → set localStorage + cookie

[5] Redirect ke /student/dashboard
     → Fetch stats (totalFloors=0, totalSessions=0)
     → Onboarding Modal muncul (3 langkah)
     → localStorage: unimath_onboarding_seen = 'true'

[6] Klik "Mulai Misi Pertama"
     → /student/practice
     → GET /api/practice/current → 404 (belum ada sesi)
     → GET /api/student/materials → [{id:'M1A', title:'Diskon...', progress:0}]
     → Pilih M1A (progress 0 < 100)
     → POST /api/practice/start {materialId:'M1A'}
     → DB: INSERT practice_sessions(floor=1, difficulty=2, status='ACTIVE')
     → sessionStorage: practiceSession = {..., floor:1, streak:0}
     → redirect ke /student/practice/M1A/play

[7] Gameplay dimulai
     → Soal pertama (difficulty=2/Sedang) ditampilkan
     → Siswa pilih jawaban → Kirim Jawaban
     → POST /api/practice/answer {sessionId, questionId, answer:'B', responseMs:4523}
     
     [Jika BENAR]:
     → floor=2, streak=1, XP=10
     → DB: INSERT practice_attempts(isCorrect=1, xpAwarded=10)
     → DB: UPDATE practice_sessions(floor=2, currentStreak=1, currentDifficulty=3)
     → DB: UPDATE users(totalPoints=totalPoints+10)
     → Modal "Benar! Naik ke lantai 2 🚀 ⭐+10 XP"
     → Soal baru (difficulty=3/Sulit)
     
     [Jika SALAH 1×]:
     → consecutiveWrong=1, streak=0
     → Soal baru (difficulty=1/Mudah) + hint1 dari soal baru
     
     [Jika SALAH 2×]:
     → consecutiveWrong=2
     → Soal baru + hint2
     
     [Jika SALAH 3×]:
     → status='REMEDIAL_REQUIRED'
     → Modal WAJIB BELAJAR muncul (tidak bisa ditutup)
     → Klik "Pelajari Materi Sekarang"
     → redirect ke /student/materials/M1A

[8] Baca materi di /student/materials/M1A
     → Scroll 80% + baca minimal X menit
     → Kerjakan Uji Pemahaman (checkpoint) — semua harus benar
     → Tombol "Kembali Latihan" unlock
     → Klik → redirect ke /student/practice/M1A/play
     
[9] Practice dilanjutkan
     → POST /api/practice/start → resume sesi yang ada
     → DB: UPDATE practice_sessions(status='ACTIVE', consecutiveWrong=0, currentQuestionId=newId)
     → Lanjut dari lantai yang sama (floor tidak turun)

[10] Setelah 10 lantai atau klik "Selesai"
     → handleEndSession('completed' atau 'user_quit')
     → sessionStorage: practiceStats = {sessionXP, bestStreak, ...}
     → POST /api/practice/end → DB: UPDATE status='COMPLETED/ABANDONED'
     → DB: awardTeacherPoints (jika completed)
     → redirect ke /student/practice/complete
     → Confetti + StatPills (XP, streak, benar, akurasi)
```

### Journey 2: Tes (Pretest/Posttest)

```
[1] Klik "Tes" dari Dashboard
     → /student/test → pilih materi → pilih PRETEST/POSTTEST

[2] /student/test/M1A/PRETEST
     → StrictTestClient mount
     → POST /api/test/start {materialId:'M1A', testType:'PRETEST'}
     → Return: {sessionId, questions:[10 soal tanpa kunci], startedAt}
     → Timer 60 menit mulai countdown dari startedAt

[3] Jawab soal (navigasi bebas via sidebar)
     → Klik opsi A/B/C/D/E → POST /api/test/answer (langsung save)
     → URAIAN: ketik → debounce 1 detik → POST /api/test/answer
     → answeredIds Set bertambah → tombol nomor jadi hijau

[4] Klik "Selesai Tes" atau waktu habis
     → Confirm dialog (manual finish)
     → Flush pending URAIAN
     → POST /api/test/finish {sessionId}
     → DB: UPDATE test_sessions SET completedAt=now
     → isTestFinished=true → tampilan "Tes Selesai"

[5] Kembali ke Dashboard
     → Tes tidak bisa dikerjakan lagi (TEST_ALREADY_COMPLETED)
```

### Journey 3: Guru Memantau Murid

```
[1] Login Guru → /teacher/dashboard
     → Stats: totalStudents, totalClasses, points

[2] /teacher/students → lihat semua murid
     → Per murid: nama, kelas, lantai tertinggi, akurasi, total sesi

[3] /teacher/classes → lihat kelas
     → Lihat murid di kelas, tambah murid baru

[4] Reward guru:
     → Setiap murid selesai sesi → +1 poin
     → Murid akurasi ≥80% → +2 poin bonus
     → teacher_profiles.points bertambah

[5] Export data (via admin panel)
     → GET /api/admin/export/practice?studentId=X
     → CSV dengan semua data: attempt per soal, waktu respons, lantai, XP
```

---

## 23. Relasi Antar Entitas (ERD)

```
users (ADMIN)
  │
  ├── [one-to-many] schools (ownerTeacherId)
  │     │
  │     └── [one-to-many] classes (schoolId)
  │           │
  │           └── [many-to-many via class_students] users (STUDENT)
  │
  └── [one-to-one] teacher_profiles (userId)

users (TEACHER)
  └── [many-to-many via teacher_schools] schools

users (STUDENT)
  ├── [one-to-many] practice_sessions (studentUserId)
  │     └── [one-to-many] practice_attempts (sessionId)
  │           └── → questions
  │
  ├── [one-to-many] test_sessions (studentUserId)
  │     └── [one-to-many] test_attempts (sessionId)
  │           └── → questions
  │
  ├── [one-to-many] student_achievements (studentUserId)
  │     └── → achievements
  │
  └── [one-to-many] auth_tokens (userId)

materials
  ├── [one-to-many] questions (materialId)
  └── [one-to-many] material_contents (materialId)
       ├── variant: SHORT
       └── variant: FULL
```

---

## 24. Catatan Bug & Fix yang Sudah Dilakukan

Berdasarkan komentar `// ✅ FIX #N:` di source code:

| Fix # | Masalah | Solusi |
|--------|---------|--------|
| #4 | Sesi terkadang tidak berakhir saat 10 lantai tercapai atau tidak ada nextQuestion | `handleEndSession` terima parameter `reason` + `sessionIdOverride`. Cek `data.floor >= TOTAL_FLOORS+1 || !data.nextQuestion` |
| #5 | Modal "Benar!" menampilkan lantai yang salah (double-increment di client) | Gunakan `floorBeforeAnswer = floor sebelum jawaban`, `floor = floor baru dari server`. Modal tampilkan `floor` (baru). |
| #10 | `responseMs` tidak valid (selalu 0 atau negatif) | `questionShownAtRef.current = Date.now()` diupdate setiap soal baru muncul, dihitung saat submit |
| #12 | Streak selalu reset ke 0 saat resume sesi | Restore `streak: data.streak \|\| 0` dari sessionStorage, gunakan `data.currentStreak` dari server |
| N/A | Sinkronisasi lantai: kembali ke lantai 1 setelah remedial | `withRetry()` untuk semua DB write. `startingFloor = MAX(floor) FROM practiceSessions`. Resume sesi yang ada, bukan buat baru. |
| N/A | N+1 query di admin dashboard | Batch GROUP BY queries, join di memori dengan Map |
| N/A | Duplikat baris di export CSV akibat JOIN classStudents | Query classStudents terpisah, ambil hanya kelas pertama per siswa |
| N/A | `request.url` di export/research route menyebabkan error `next build` | Gunakan static params atau `headers()` |

---

## 25. Status Pengembangan Saat Ini

### ✅ Sudah Selesai & Berfungsi

| Fitur | Catatan |
|-------|---------|
| Auth multi-role (Admin/Guru/Siswa) | Stabil |
| Login siswa via NISN + set password | Stabil |
| Dashboard siswa lengkap | Badge, XP, rank, onboarding |
| Adaptive practice (floor + difficulty) | Retry mechanism untuk SQLite |
| XP system per-answer | Server-authoritative |
| Badge tiers (6 level) | Client-calculated |
| Leaderboard top-20 | Colored rank circles |
| Wajib Belajar / Remedial Gate | 3× salah berturut |
| Material content (SHORT/FULL/VIDEO) | 9 materi |
| Checkpoint / Uji Pemahaman | Tidak dibahas jawabannya |
| Pretest & Posttest (strict mode) | 60-menit timer |
| Admin panel lengkap | CRUD user, materi, soal |
| CSV upload soal (3 format) | Auto-detect, deduplication |
| CSV export data latihan | Filter by studentId/materialId |
| Teacher dashboard + reward poin | +1/+3 per sesi |
| Teacher password reset via OTP email | Resend API |
| Maintenance mode | Bypass cookie 8 jam |
| Opsi E pada soal (A-E) | Schema updated, upload & play |
| Onboarding modal | 1× saja via localStorage |
| Response time tracking | `responseMs` per attempt |
| Session resume (restart halaman) | sessionStorage + API /current |
| Sinkronisasi lantai (floor sync) | MAX(floor) + retry mechanism |

### ⚠️ Diketahui Perlu Perbaikan / Belum Sempurna

| Masalah | File | Keterangan |
|---------|------|-----------|
| Opsi E belum di-render di halaman TES | `StrictTestClient.tsx` L339 | Loop hanya A-D, belum include optE |
| `next build` error di `/api/admin/export/research` | export/research/route.ts | Menggunakan `request.url` → dynamic server usage error |
| `checkpointQuestion` dan `checkpointAnswer` di `materials` tabel | schema.ts | DEPRECATED, perlu migrasi ke `material_contents.checkpointItems` |

### 📋 Fitur yang Direncanakan (Belum Diimplementasikan)

| Fitur | Status |
|-------|--------|
| Bulk update soal (update existing, bukan hanya insert) | Planning |
| Upload soal ke semua materi sekaligus via satu CSV | Planning (vExport sudah mendukung) |
| Profil siswa di halaman tes (di samping menu pretest/posttest) | Planning |
| Revisi UI: "Ulangi Latihan" → "Kembali ke Dashboard" | Planning |
| Revisi UI: "Pilih Materi Lain" → "Latihan" | Planning |
| Achievement checker (otomatis unlock saat threshold tercapai) | Planning |
| Teacher dapat lihat soal per materi | Planning |

---

> **Dokumen ini dibuat dari analisis langsung seluruh source code UniMath pada 21 Juni 2026.**
> 
> **File-file yang dibaca secara langsung:**
> - `src/middleware.ts` (145 baris)
> - `src/lib/db/schema.ts` (252 baris)
> - `src/lib/auth/context.tsx` (126 baris)
> - `src/lib/auth/utils.ts` (80 baris)
> - `src/lib/types.ts` (172 baris)
> - `src/app/api/practice/start/route.ts` (357 baris)
> - `src/app/api/practice/answer/route.ts` (344 baris)
> - `src/app/api/practice/current/route.ts` (185 baris)
> - `src/app/api/practice/end/route.ts` (122 baris)
> - `src/app/api/test/start/route.ts` (100 baris)
> - `src/app/api/admin/questions/upload/route.ts` (432 baris)
> - `src/app/api/admin/export/practice/route.ts` (219 baris)
> - `src/app/student/practice/[materialId]/play/page.tsx` (802 baris)
> - `src/app/student/practice/page.tsx` (254 baris)
> - `src/app/student/practice/complete/page.tsx` (272 baris)
> - `src/app/student/test/[materialId]/[testType]/StrictTestClient.tsx` (430 baris)
> - `src/app/student/dashboard/page.tsx` (372 baris)
> - `src/app/student/leaderboard/page.tsx` (141 baris)
> - `package.json` (51 baris)
