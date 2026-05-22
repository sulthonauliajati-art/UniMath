import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, practiceAttempts, users } from '@/lib/db/schema'
import { eq, and, notInArray, or, sql } from 'drizzle-orm'

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

/**
 * Fetch a new PRACTICE question at the given difficulty, excluding already-used question IDs.
 * Falls back to any difficulty if none found at target, then resets exclusion list if truly empty.
 */
async function getNewQuestion(
  materialId: string,
  difficulty: number,
  excludeIds: string[]
) {
  // 1. Try exact difficulty, excluding used
  let available = await db
    .select()
    .from(questions)
    .where(
      excludeIds.length > 0
        ? and(
            eq(questions.materialId, materialId),
            eq(questions.difficulty, difficulty),
            or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')),
            notInArray(questions.id, excludeIds)
          )
        : and(
            eq(questions.materialId, materialId),
            eq(questions.difficulty, difficulty),
            or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
          )
    )

  // 2. If no unused at target difficulty, try any PRACTICE question not yet used
  if (available.length === 0) {
    available = await db
      .select()
      .from(questions)
      .where(
        excludeIds.length > 0
          ? and(
              eq(questions.materialId, materialId),
              or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')),
              notInArray(questions.id, excludeIds)
            )
          : and(
              eq(questions.materialId, materialId),
              or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
            )
      )
  }

  // 3. If ALL used, reset (allow repeats) but try target difficulty first
  if (available.length === 0) {
    available = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.materialId, materialId),
          eq(questions.difficulty, difficulty),
          or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
        )
      )
  }

  // 4. Absolute fallback: any PRACTICE question for this material
  if (available.length === 0) {
    available = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.materialId, materialId),
          or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
        )
      )
  }

  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
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

    const isCorrect = answer === question.correct

    // Collect all used question IDs in this session for rotation
    const usedAttempts = await db
      .select({ questionId: practiceAttempts.questionId })
      .from(practiceAttempts)
      .where(eq(practiceAttempts.sessionId, sessionId))

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

      // Persist attempt with XP
      await db.insert(practiceAttempts).values({
        id: attemptId,
        sessionId,
        floor: session.floor,
        questionId,
        answer: answer as 'A' | 'B' | 'C' | 'D',
        isCorrect,
        xpAwarded: xpGain,
        hintCountAtAnswer: session.consecutiveWrong,
        difficultyAtAnswer: session.currentDifficulty,
        isRemedialSession: session.status === 'REMEDIAL_REQUIRED',
        responseMs: responseMs || 0,
        createdAt: new Date().toISOString(),
      })

      // Update session: reset consecutive wrong, raise floor & difficulty & streak
      await db
        .update(practiceSessions)
        .set({
          floor: newFloor,
          consecutiveWrong: 0,
          currentStreak: newStreak,
          currentDifficulty: nextQ ? nextQ.difficulty : nextDifficulty,
          currentQuestionId: nextQ?.id || null,
        })
        .where(eq(practiceSessions.id, sessionId))

      // Persist XP to user immediately — never lost even if browser closes
      await db
        .update(users)
        .set({
          totalPoints: sql`COALESCE(total_points, 0) + ${xpGain}`,
        })
        .where(eq(users.id, session.studentUserId))

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

    // Persist attempt (0 XP for wrong)
    await db.insert(practiceAttempts).values({
      id: attemptId,
      sessionId,
      floor: session.floor,
      questionId,
      answer: answer as 'A' | 'B' | 'C' | 'D',
      isCorrect,
      xpAwarded: 0,
      hintCountAtAnswer: session.consecutiveWrong,
      difficultyAtAnswer: session.currentDifficulty,
      isRemedialSession: session.status === 'REMEDIAL_REQUIRED',
      responseMs: responseMs || 0,
      createdAt: new Date().toISOString(),
    })

    const newConsecutiveWrong = session.consecutiveWrong + 1

    // Difficulty goes DOWN: Sulit→Sedang, Sedang→Mudah, Mudah→Mudah
    const nextDifficulty = clampDifficulty(session.currentDifficulty - 1)

    // ── CASE 2a: 3 consecutive wrong → WAJIB BELAJAR ──
    if (newConsecutiveWrong >= 3) {
      await db
        .update(practiceSessions)
        .set({
          status: 'REMEDIAL_REQUIRED',
          consecutiveWrong: newConsecutiveWrong,
          currentStreak: 0, // reset streak on wrong
          currentDifficulty: nextDifficulty,
          currentQuestionId: null, // will get new question after remedial
        })
        .where(eq(practiceSessions.id, sessionId))

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

    // Update session
    await db
      .update(practiceSessions)
      .set({
        consecutiveWrong: newConsecutiveWrong,
        currentStreak: 0, // reset streak on wrong
        currentDifficulty: nextQ ? nextQ.difficulty : nextDifficulty,
        currentQuestionId: nextQ?.id || null,
      })
      .where(eq(practiceSessions.id, sessionId))

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
