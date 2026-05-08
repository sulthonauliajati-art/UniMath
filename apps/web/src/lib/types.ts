// User & Auth Types
export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface User {
  id: string
  role: UserRole
  nisn?: string
  name: string
  email?: string
  passwordStatus: 'UNSET' | 'SET'
  createdAt: string
}

export interface Teacher {
  userId: string
  displayName: string
  schoolIds: string[]
  points: number
}

export interface AuthToken {
  token: string
  userId: string
  role: UserRole
  expiresAt: string
}

// Organization Types
export interface School {
  id: string
  name: string
  ownerTeacherId: string
  createdAt: string
}

export interface Class {
  id: string
  schoolId: string
  name: string
  grade: string
  createdAt: string
  studentCount?: number
}

export interface ClassStudent {
  classId: string
  studentUserId: string
}

// Content Types
export interface Material {
  id: string
  title: string
  summaryUrl?: string
  fullUrl?: string
  videoUrl?: string
  order: number
  progress?: number
}

export interface Question {
  id: string
  materialId: string
  mode: 'PRACTICE' | 'PRETEST' | 'POSTTEST' | 'ALL'
  indicator: 'I1' | 'I2' | 'I3' | 'I4'
  difficulty: number
  questionType?: string
  question: string
  optA: string
  optB: string
  optC: string
  optD: string
  correct?: 'A' | 'B' | 'C' | 'D' // Hidden from client during game
  hint1?: string
  hint2?: string
  hint3?: string
  explanation?: string
  remedialMaterialId?: string
}

// Practice Types
export interface PracticeSession {
  id: string
  studentUserId: string
  materialId: string
  floor: number
  consecutiveWrong: number
  currentDifficulty: number // 1=Mudah, 2=Sedang, 3=Sulit
  currentQuestionId?: string
  startedAt: string
  endedAt?: string
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'REMEDIAL_REQUIRED'
}

export interface PracticeAttempt {
  id: string
  sessionId: string
  floor: number
  questionId: string
  answer: 'A' | 'B' | 'C' | 'D'
  isCorrect: boolean
  hintCountAtAnswer: number
  difficultyAtAnswer: number
  isRemedialSession: boolean
  responseMs: number
  createdAt: string
}

export interface TestSession {
  id: string
  studentUserId: string
  materialId: string
  testType: 'PRETEST' | 'POSTTEST'
  startedAt: string
  completedAt?: string
}

export interface TestAttempt {
  id: string
  sessionId: string
  questionId: string
  answer: string
  isCorrect: boolean | null
  responseMs?: number
  createdAt: string
}

// Stats Types
export interface StudentStats {
  totalFloors: number
  totalSessions: number
  totalAttempts: number
  correctAttempts: number
  accuracy: number
  materialProgress: { materialId: string; progress: number }[]
}

export interface TeacherStats {
  totalStudents: number
  totalClasses: number
  totalSchools: number
  points: number
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface AnswerResponse {
  isCorrect: boolean
  floor: number
  consecutiveWrong: number
  currentDifficulty: number
  difficultyLabel: string
  nextQuestion?: Question
  previousHint?: string // hint dari soal yang baru dijawab salah
  mustStudy?: boolean
  explanation?: string
}

export interface SessionStats {
  floorsClimbed: number
  correctAnswers: number
  totalAttempts: number
}
