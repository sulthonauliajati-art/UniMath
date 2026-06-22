import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, practiceAttempts, users } from '@/lib/db/schema'
import { eq, and, or, sql } from 'drizzle-orm'
import { resolveAuthenticatedUserId } from '@/lib/auth/server'

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

/**
 * ⚡ OPTIMASI: Ambil SEMUA soal untuk materi tertentu dalam SATU query,
 * lalu filter di memori (JavaScript) — eliminasi 3-4 DB round-trips menjadi 1.
 *
 * Dengan index questions_material_difficulty_idx, query ini sangat cepat
 * dan tidak tergantung ukuran tabel total.
 */
async function getNewQuestion(
  materialId: string,
  difficulty: number,
  excludeIds: string[]
) {
  // Satu query: ambil semua soal PRACTICE untuk materi ini (sudah di-index)
  const allQuestions = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.materialId, materialId),
        or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
      )
    )

  if (allQuestions.length === 0) return null

  const excludeSet = new Set(excludeIds)

  // Filter di memori — zero additional DB calls
  const atTargetUnused = allQuestions.filter(q => q.difficulty === difficulty && !excludeSet.has(q.id))
  if (atTargetUnused.length > 0) return atTargetUnused[Math.floor(Math.random() * atTargetUnused.length)]

  const anyUnused = allQuestions.filter(q => !excludeSet.has(q.id))
  if (anyUnused.length > 0) return anyUnused[Math.floor(Math.random() * anyUnused.length)]

  // Semua sudah dipakai — boleh ulang
  const atTarget = allQuestions.filter(q => q.difficulty === difficulty)
  if (atTarget.length > 0) return atTarget[Math.floor(Math.random() * atTarget.length)]

  return allQuestions[Math.floor(Math.random() * allQuestions.length)]
}

/**
 * ⚡ RETRY: SQLite (Turso) hanya bisa 1 write bersamaan.
 * Jika ada timeout/locked, coba lagi sampai maxRetries kali.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 100): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const isLast = attempt === maxRetries
      const errMsg = err instanceof Error ? err.message : String(err)
      const isRetryable = errMsg.includes('SQLITE_BUSY') ||
                          errMsg.includes('database is locked') ||
                          errMsg.includes('timeout') ||
                          errMsg.includes('BLOCKED')
      if (isLast || !isRetryable) throw err
      // Exponential backoff: 100ms, 200ms, 400ms...
      await new Promise(r => setTimeout(r, delayMs * attempt))
    }
  }
  throw new Error('Max retries exceeded')
}

function formatQuestionForClient(q: typeof questions.$inferSelect) {
  return {
    id: q.id,
    materialId: q.materialId,
    difficulty: q.difficulty,
    difficultyLabel: DIFFICULTY_LABELS[q.difficulty] || 'Sedang',
    question: q.question,
    optA: q.optA,
    optB: q.optB,
    optC: q.optC,
    optD: q.optD,
    optE: q.optE || '',
  }
}

/** Clamp difficulty between 1 (Mudah) and 3 (Sulit) */
function clampDifficulty(d: number): number {
  return Math.max(1, Math.min(3, d))
}

/** XP multiplier based on current correct-answer streak (server-authoritative) */
const BASE_XP = 10
function getXPMultiplier(streak: number): number {
  if (streak >= 10) return 3
  if (streak >= 5) return 2
  if (streak >= 3) return 1.5
  return 1
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, answer, responseMs } = await request.json()

    if (!sessionId || !questionId || !answer) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Data tidak lengkap' } },
        { status: 400 }
      )
    }

    // Validasi answer hanya boleh A, B, C, D, atau E
    const validAnswers = new Set(['A', 'B', 'C', 'D', 'E'])
    if (!validAnswers.has(String(answer).toUpperCase())) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Jawaban tidak valid. Gunakan A, B, C, D, atau E.' } },
        { status: 400 }
      )
    }

    // Validasi responseMs — harus positive number
    const sanitizedResponseMs = (typeof responseMs === 'number' && responseMs >= 0)
      ? Math.round(responseMs)
      : 0

    // ── AUTH: Resolve authenticated user ──
    const userId = await resolveAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Autentikasi diperlukan' } },
        { status: 401 }
      )
    }

    // Get the question being answered
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)

    if (!question) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Soal tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get the session
    const [session] = await db
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.id, sessionId))
      .limit(1)

    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session tidak ditemukan' } },
        { status: 404 }
      )
    }

    // ── GUARD: Session ownership ──
    if (session.studentUserId !== userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Session ini bukan milik Anda' } },
        { status: 403 }
      )
    }

    // ── GUARD: Session must be ACTIVE (or REMEDIAL_REQUIRED for transition) ──
    // REMEDIAL_REQUIRED sessions get rejected — student must study first via /api/practice/start
    if (session.status === 'REMEDIAL_REQUIRED') {
      return NextResponse.json(
        { error: { code: 'REMEDIAL_REQUIRED', message: 'Kamu harus mempelajari materi dulu sebelum melanjutkan latihan' } },
        { status: 403 }
      )
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: { code: 'SESSION_INACTIVE', message: 'Session sudah tidak aktif' } },
        { status: 403 }
      )
    }

    // ── GUARD: Question must match current question ──
    // Prevents answering arbitrary questions or questions from different materials
    if (session.currentQuestionId && questionId !== session.currentQuestionId) {
      return NextResponse.json(
        { error: { code: 'QUESTION_MISMATCH', message: 'Soal ini bukan soal yang sedang ditampilkan' } },
        { status: 403 }
      )
    }

    // ── GUARD: Duplicate answer prevention ──
    const [existingAttempt] = await db
      .select({ id: practiceAttempts.id })
      .from(practiceAttempts)
      .where(
        and(
          eq(practiceAttempts.sessionId, sessionId),
          eq(practiceAttempts.questionId, questionId)
        )
      )
      .limit(1)

    if (existingAttempt) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_ANSWER', message: 'Soal ini sudah kamu jawab' } },
        { status: 409 }
      )
    }

    const isCorrect = answer === question.correct

    // Collect used question IDs untuk rotasi soal
    // ⚡ LIMIT 100: cegah scan semua attempt historis — cukup untuk rotasi soal
    const usedAttempts = await db
      .select({ questionId: practiceAttempts.questionId })
      .from(practiceAttempts)
      .where(eq(practiceAttempts.sessionId, sessionId))
      .limit(100)

    const usedQuestionIds = Array.from(new Set(usedAttempts.map((a) => a.questionId)))
    usedQuestionIds.push(questionId) // also exclude current question

    // Save attempt (XP calculated below for correct answers)
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get material name
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, session.materialId))
      .limit(1)

    // ──────────────────────────────────────────────────────────────────
    // CASE 1: CORRECT ANSWER
    // ──────────────────────────────────────────────────────────────────
    if (isCorrect) {
      const newFloor = session.floor + 1
      const newStreak = (session.currentStreak || 0) + 1

      // Calculate XP server-side (authoritative)
      const multiplier = getXPMultiplier(newStreak)
      const xpGain = Math.round(BASE_XP * multiplier)

      // Difficulty goes UP:  Mudah→Sedang, Sedang→Sulit, Sulit→Sulit
      const nextDifficulty = clampDifficulty(session.currentDifficulty + 1)

      // Get next question at new difficulty
      const nextQ = await getNewQuestion(session.materialId, nextDifficulty, usedQuestionIds)

      // ⚡ RETRY: Persist attempt + update session dalam satu blok dengan retry
      // agar tidak kehilangan data saat SQLite write queue penuh
      await withRetry(() => db.insert(practiceAttempts).values({
        id: attemptId,
        sessionId,
        floor: session.floor,
        questionId,
        answer: answer as 'A' | 'B' | 'C' | 'D' | 'E',
        isCorrect,
        xpAwarded: xpGain,
        hintCountAtAnswer: session.consecutiveWrong,
        difficultyAtAnswer: session.currentDifficulty,
        isRemedialSession: false,
        responseMs: sanitizedResponseMs,
        createdAt: new Date().toISOString(),
      }))

      // ⚡ RETRY: Update session floor — ini yang menyebabkan "balik ke lantai 1"
      // jika write gagal tanpa retry!
      await withRetry(() => db
        .update(practiceSessions)
        .set({
          floor: newFloor,
          consecutiveWrong: 0,
          currentStreak: newStreak,
          currentDifficulty: nextQ ? nextQ.difficulty : nextDifficulty,
          currentQuestionId: nextQ?.id || null,
        })
        .where(eq(practiceSessions.id, sessionId))
      )

      // ⚡ RETRY: Persist XP — tidak boleh hilang
      await withRetry(() => db
        .update(users)
        .set({
          totalPoints: sql`COALESCE(total_points, 0) + ${xpGain}`,
        })
        .where(eq(users.id, session.studentUserId))
      )

      return NextResponse.json({
        isCorrect: true,
        floor: newFloor,
        consecutiveWrong: 0,
        currentStreak: newStreak,
        currentDifficulty: nextQ ? nextQ.difficulty : nextDifficulty,
        difficultyLabel: DIFFICULTY_LABELS[nextQ ? nextQ.difficulty : nextDifficulty] || 'Sedang',
        nextQuestion: nextQ ? formatQuestionForClient(nextQ) : null,
        xpGain, // for client animation
      })
    }

    // ──────────────────────────────────────────────────────────────────
    // CASE 2: WRONG ANSWER
    // ──────────────────────────────────────────────────────────────────

    // ⚡ RETRY: Persist attempt (0 XP for wrong)
    await withRetry(() => db.insert(practiceAttempts).values({
      id: attemptId,
      sessionId,
      floor: session.floor,
      questionId,
      answer: answer as 'A' | 'B' | 'C' | 'D' | 'E',
      isCorrect,
      xpAwarded: 0,
      hintCountAtAnswer: session.consecutiveWrong,
      difficultyAtAnswer: session.currentDifficulty,
      isRemedialSession: false,
      responseMs: sanitizedResponseMs,
      createdAt: new Date().toISOString(),
    }))

    const newConsecutiveWrong = session.consecutiveWrong + 1

    // Difficulty goes DOWN: Sulit→Sedang, Sedang→Mudah, Mudah→Mudah
    const nextDifficulty = clampDifficulty(session.currentDifficulty - 1)

    // ── CASE 2a: 3 consecutive wrong → WAJIB BELAJAR ──
    if (newConsecutiveWrong >= 3) {
      await withRetry(() => db
        .update(practiceSessions)
        .set({
          status: 'REMEDIAL_REQUIRED',
          consecutiveWrong: newConsecutiveWrong,
          currentStreak: 0,
          currentDifficulty: nextDifficulty,
          currentQuestionId: null,
        })
        .where(eq(practiceSessions.id, sessionId))
      )

      return NextResponse.json({
        isCorrect: false,
        floor: session.floor,
        consecutiveWrong: newConsecutiveWrong,
        currentDifficulty: nextDifficulty,
        difficultyLabel: DIFFICULTY_LABELS[nextDifficulty] || 'Sedang',
        mustStudy: true,
        materialId: session.materialId,
        materialName: material?.title || 'Materi',
        explanation: question.explanation,
        message: 'Kamu sudah salah menjawab 3 kali berturut-turut. Yuk pelajari materi dulu!',
      })
    }

    // ── CASE 2b: wrong but < 3 consecutive → give hint + NEW question ──
    // Get NEW question at the lowered difficulty
    const nextQ = await getNewQuestion(session.materialId, nextDifficulty, usedQuestionIds)

    // ⚡ RETRY: Update session
    await withRetry(() => db
      .update(practiceSessions)
      .set({
        consecutiveWrong: newConsecutiveWrong,
        currentStreak: 0,
        currentDifficulty: nextQ ? nextQ.difficulty : nextDifficulty,
        currentQuestionId: nextQ?.id || null,
      })
      .where(eq(practiceSessions.id, sessionId))
    )

    // Determine which hint to show FOR THE QUESTION THE STUDENT IS ABOUT TO SEE.
    // The hint tier escalates with consecutive wrongs so a struggling student
    // gets progressively more scaffold on each new attempt:
    //   consecutiveWrong==1 → nextQ.hint1
    //   consecutiveWrong==2 → nextQ.hint2
    const currentHint = nextQ
      ? newConsecutiveWrong === 1
        ? nextQ.hint1
        : newConsecutiveWrong === 2
          ? nextQ.hint2
          : null
      : null

    return NextResponse.json({
      isCorrect: false,
      floor: session.floor,
      consecutiveWrong: newConsecutiveWrong,
      currentDifficulty: nextQ ? nextQ.difficulty : nextDifficulty,
      difficultyLabel: DIFFICULTY_LABELS[nextQ ? nextQ.difficulty : nextDifficulty] || 'Sedang',
      nextQuestion: nextQ ? formatQuestionForClient(nextQ) : null,
      currentHint, // hint from the CURRENTLY displayed (next) question
    })
  } catch (error) {
    console.error('Answer error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
