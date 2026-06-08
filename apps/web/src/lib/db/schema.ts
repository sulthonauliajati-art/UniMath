import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Users table - teachers, students, and admin
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  role: text('role', { enum: ['STUDENT', 'TEACHER', 'ADMIN'] }).notNull(),
  nisn: text('nisn'),
  name: text('name').notNull(),
  email: text('email'),
  password: text('password'),
  passwordStatus: text('password_status', { enum: ['UNSET', 'SET'] }).notNull().default('UNSET'),
  avatarUrl: text('avatar_url'),
  totalPoints: integer('total_points').default(0),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  // Index untuk filter by role (admin queries)
  roleIdx: index('users_role_idx').on(table.role),
  // Index untuk cari siswa by NISN
  nisnIdx: index('users_nisn_idx').on(table.nisn),
}))

// Teacher profiles
export const teacherProfiles = sqliteTable('teacher_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id),
  displayName: text('display_name').notNull(),
  points: integer('points').notNull().default(0),
})

// Schools
export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerTeacherId: text('owner_teacher_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
})

// Teacher-School relationship (many-to-many)
export const teacherSchools = sqliteTable('teacher_schools', {
  teacherId: text('teacher_id').notNull().references(() => users.id),
  schoolId: text('school_id').notNull().references(() => schools.id),
})

// Classes
export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  name: text('name').notNull(),
  grade: text('grade').notNull(),
  createdAt: text('created_at').notNull(),
})

// Class-Student relationship
export const classStudents = sqliteTable('class_students', {
  classId: text('class_id').notNull().references(() => classes.id),
  studentUserId: text('student_user_id').notNull().references(() => users.id),
}, (table) => ({
  // Index untuk lookup: siswa mana yang ada di kelas tertentu
  studentIdx: index('class_students_student_idx').on(table.studentUserId),
  classIdx: index('class_students_class_idx').on(table.classId),
}))


// Materials
export const materials = sqliteTable('materials', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  shortDescription: text('short_description'), // Deskripsi singkat materi
  grade: text('grade').notNull().default('4'), // Tingkat kelas
  summaryUrl: text('summary_url'), // Google Drive link untuk ringkasan PDF
  fullUrl: text('full_url'), // Google Drive link untuk materi lengkap PDF
  videoUrl: text('video_url'), // YouTube embed URL
  thumbnailUrl: text('thumbnail_url'),
  order: integer('order').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at'),
  // === Konten Akademik (Jalur 2) ===
  learningObjectives: text('learning_objectives'), // JSON array of strings
  summaryContent: text('summary_content'), // Teks ringkasan materi lengkap
  commonMistakes: text('common_mistakes'), // Kesalahan umum siswa
  remedialText: text('remedial_text'), // Teks untuk layar remedial
  videoDescription: text('video_description'), // Deskripsi konten video (panduan produksi)
  checkpointQuestion: text('checkpoint_question'), // Soal checkpoint
  checkpointAnswer: text('checkpoint_answer'), // Jawaban checkpoint
})

// Questions
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  materialId: text('material_id').notNull().references(() => materials.id),
  mode: text('mode', { enum: ['PRACTICE', 'PRETEST', 'POSTTEST', 'ALL'] }).notNull().default('ALL'),
  indicator: text('indicator', { enum: ['I1', 'I2', 'I3', 'I4'] }).notNull().default('I1'),
  difficulty: integer('difficulty').notNull(),
  questionType: text('question_type').default('PG'),
  question: text('question').notNull(),
  optA: text('opt_a').notNull(),
  optB: text('opt_b').notNull(),
  optC: text('opt_c').notNull(),
  optD: text('opt_d').notNull(),
  correct: text('correct', { enum: ['A', 'B', 'C', 'D'] }).notNull(),
  hint1: text('hint1'),
  hint2: text('hint2'),
  hint3: text('hint3'),
  explanation: text('explanation'),
  remedialMaterialId: text('remedial_material_id'),
}, (table) => ({
  // ⚡ CRITICAL: Query soal by materialId + difficulty + mode terjadi SETIAP jawaban
  materialDifficultyIdx: index('questions_material_difficulty_idx').on(table.materialId, table.difficulty, table.mode),
  // Index untuk cari soal by materi saja
  materialIdx: index('questions_material_idx').on(table.materialId),
}))

// Material Contents — konten materi belajar (SHORT & FULL per material)
export const materialContents = sqliteTable('material_contents', {
  id: text('id').primaryKey(),                      // "M1A-SHORT", "R1-FULL"
  materialId: text('material_id').notNull(),         // "M1A", "R1"
  materialType: text('material_type'),               // "MAIN" | "REMEDIAL"
  contentVariant: text('content_variant'),            // "SHORT" | "FULL"
  displayTitle: text('display_title'),
  shortDescription: text('short_description'),
  whyRedirected: text('why_redirected'),
  learningObjectives: text('learning_objectives'),    // JSON array string
  conceptText: text('concept_text'),
  formulas: text('formulas'),                         // JSON array string
  steps: text('steps'),                               // JSON array string
  examples: text('examples'),                         // JSON array string
  commonMistakes: text('common_mistakes'),             // JSON array string
  checkpointItems: text('checkpoint_items'),           // JSON array string
  bodyMarkdown: text('body_markdown'),                 // Full markdown content
  wajibBelajarMessage: text('wajib_belajar_message'),
  triggerCommonErrors: text('trigger_common_errors'),  // semicolon-separated
  relatedFloorStart: integer('related_floor_start'),
  relatedFloorEnd: integer('related_floor_end'),
  relatedIndicators: text('related_indicators'),       // comma-separated
  relatedRemedialIds: text('related_remedial_ids'),    // comma-separated
  estimatedReadingMinutes: integer('estimated_reading_minutes'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
})

// Practice Sessions
export const practiceSessions = sqliteTable('practice_sessions', {
  id: text('id').primaryKey(),
  studentUserId: text('student_user_id').notNull().references(() => users.id),
  materialId: text('material_id').notNull().references(() => materials.id),
  floor: integer('floor').notNull().default(1),
  consecutiveWrong: integer('consecutive_wrong').notNull().default(0),
  currentDifficulty: integer('current_difficulty').notNull().default(2),
  currentStreak: integer('current_streak').notNull().default(0),
  currentQuestionId: text('current_question_id'),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  status: text('status', { enum: ['ACTIVE', 'COMPLETED', 'ABANDONED', 'REMEDIAL_REQUIRED'] })
    .notNull()
    .default('ACTIVE'),
}, (table) => ({
  // ⚡ CRITICAL: Paling sering di-query — cari session AKTIF milik siswa
  studentStatusIdx: index('practice_sessions_student_status_idx').on(table.studentUserId, table.status),
  // Index untuk cari session by siswa + materi (start/resume)
  studentMaterialIdx: index('practice_sessions_student_material_idx').on(table.studentUserId, table.materialId),
  // Index untuk aggregate stats (admin dashboard)
  studentIdx: index('practice_sessions_student_idx').on(table.studentUserId),
}))

// Practice Attempts
export const practiceAttempts = sqliteTable('practice_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => practiceSessions.id),
  floor: integer('floor').notNull(),
  questionId: text('question_id').notNull().references(() => questions.id),
  answer: text('answer', { enum: ['A', 'B', 'C', 'D'] }).notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  xpAwarded: integer('xp_awarded').notNull().default(0),
  hintCountAtAnswer: integer('hint_count_at_answer').default(0),
  difficultyAtAnswer: integer('difficulty_at_answer').notNull(),
  isRemedialSession: integer('is_remedial_session', { mode: 'boolean' }).default(false),
  responseMs: integer('response_ms').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  // ⚡ CRITICAL: Setiap jawaban query semua attempt by sessionId untuk stats
  sessionIdx: index('practice_attempts_session_idx').on(table.sessionId),
  // Index untuk admin export — query by session + isCorrect
  sessionCorrectIdx: index('practice_attempts_session_correct_idx').on(table.sessionId, table.isCorrect),
}))

// Test Sessions (Strict)
export const testSessions = sqliteTable('test_sessions', {
  id: text('id').primaryKey(),
  studentUserId: text('student_user_id').notNull().references(() => users.id),
  materialId: text('material_id').notNull().references(() => materials.id),
  testType: text('test_type', { enum: ['PRETEST', 'POSTTEST'] }).notNull(),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
}, (table) => ({
  studentTypeIdx: index('test_sessions_student_type_idx').on(table.studentUserId, table.testType),
}))

// Test Attempts (Strict)
export const testAttempts = sqliteTable('test_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => testSessions.id),
  questionId: text('question_id').notNull().references(() => questions.id),
  answer: text('answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  responseMs: integer('response_ms'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  sessionIdx: index('test_attempts_session_idx').on(table.sessionId),
}))

// Auth Tokens
export const authTokens = sqliteTable('auth_tokens', {
  token: text('token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role', { enum: ['STUDENT', 'TEACHER', 'ADMIN'] }).notNull(),
  expiresAt: text('expires_at').notNull(),
}, (table) => ({
  // ⚡ CRITICAL: Tiap request HTTP validate token via DB — harus cepat
  // token sudah PRIMARY KEY (index otomatis), tapi tambahkan index by userId
  // untuk revokeAllUserTokens (DELETE WHERE user_id = ?)
  userIdIdx: index('auth_tokens_user_id_idx').on(table.userId),
}))

// Password Reset OTP
export const passwordResetOtp = sqliteTable('password_reset_otp', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  otp: text('otp').notNull(),
  expiresAt: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
})

// Achievements/Badges
export const achievements = sqliteTable('achievements', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // emoji or icon name
  type: text('type', { enum: ['FLOOR', 'ACCURACY', 'STREAK', 'MATERIAL', 'SPECIAL'] }).notNull(),
  requirement: integer('requirement').notNull(), // e.g., 10 floors, 80% accuracy
  points: integer('points').notNull().default(10),
})

// Student Achievements (earned badges)
export const studentAchievements = sqliteTable('student_achievements', {
  id: text('id').primaryKey(),
  studentUserId: text('student_user_id').notNull().references(() => users.id),
  achievementId: text('achievement_id').notNull().references(() => achievements.id),
  earnedAt: text('earned_at').notNull(),
})
