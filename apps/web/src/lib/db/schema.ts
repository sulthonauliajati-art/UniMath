import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

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
})

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
})


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
})

// Practice Sessions
export const practiceSessions = sqliteTable('practice_sessions', {
  id: text('id').primaryKey(),
  studentUserId: text('student_user_id').notNull().references(() => users.id),
  materialId: text('material_id').notNull().references(() => materials.id),
  floor: integer('floor').notNull().default(0),
  wrongCount: integer('wrong_count').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  status: text('status', { enum: ['ACTIVE', 'COMPLETED', 'ABANDONED', 'REMEDIAL_REQUIRED'] })
    .notNull()
    .default('ACTIVE'),
})

// Practice Attempts
export const practiceAttempts = sqliteTable('practice_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => practiceSessions.id),
  floor: integer('floor').notNull(),
  questionId: text('question_id').notNull().references(() => questions.id),
  answer: text('answer', { enum: ['A', 'B', 'C', 'D'] }).notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  usedHintLevel: integer('used_hint_level').default(0),
  isRemedialSession: integer('is_remedial_session', { mode: 'boolean' }).default(false),
  responseMs: integer('response_ms').notNull(),
  createdAt: text('created_at').notNull(),
})

// Test Sessions (Strict)
export const testSessions = sqliteTable('test_sessions', {
  id: text('id').primaryKey(),
  studentUserId: text('student_user_id').notNull().references(() => users.id),
  materialId: text('material_id').notNull().references(() => materials.id),
  testType: text('test_type', { enum: ['PRETEST', 'POSTTEST'] }).notNull(),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
})

// Test Attempts (Strict)
export const testAttempts = sqliteTable('test_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => testSessions.id),
  questionId: text('question_id').notNull().references(() => questions.id),
  answer: text('answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  responseMs: integer('response_ms'),
  createdAt: text('created_at').notNull(),
})

// Auth Tokens
export const authTokens = sqliteTable('auth_tokens', {
  token: text('token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role', { enum: ['STUDENT', 'TEACHER', 'ADMIN'] }).notNull(),
  expiresAt: text('expires_at').notNull(),
})

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
