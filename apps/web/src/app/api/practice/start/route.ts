import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, practiceAttempts } from '@/lib/db/schema'
import { eq, and, or, desc, notInArray } from 'drizzle-orm'

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { materialId } = body

    // Get user from cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')
    let userId = 'anonymous'

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        userId = user.id
      } catch {}
    }

    // If no materialId provided, use first material
    if (!materialId) {
      const allMaterials = await db.select().from(materials).orderBy(materials.order)
      materialId = allMaterials[0]?.id
    }

    if (!materialId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tidak ada materi tersedia' } },
        { status: 404 }
      )
    }

    // ──────────────────────────────────────────────────────────────
    // CHECK FOR EXISTING ACTIVE SESSION — Resume if found!
    // ──────────────────────────────────────────────────────────────
    const existingSessions = await db
      .select()
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.studentUserId, userId),
          eq(practiceSessions.materialId, materialId),
          or(
            eq(practiceSessions.status, 'ACTIVE'),
            eq(practiceSessions.status, 'REMEDIAL_REQUIRED')
          )
        )
      )
      .orderBy(desc(practiceSessions.startedAt))
      .limit(1)

    if (existingSessions.length > 0) {
      const session = existingSessions[0]

      // Get material info
      const [material] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, materialId))
        .limit(1)

      // Try to get the current question from the session
      let currentQuestion = null
      if (session.currentQuestionId) {
        const [q] = await db
          .select()
          .from(questions)
          .where(eq(questions.id, session.currentQuestionId))
          .limit(1)
        currentQuestion = q || null
      }

      // If no current question (e.g., after remedial), pick a new one
      if (!currentQuestion) {
        const usedAttempts = await db
          .select({ questionId: practiceAttempts.questionId })
          .from(practiceAttempts)
          .where(eq(practiceAttempts.sessionId, session.id))
        const usedIds = Array.from(new Set(usedAttempts.map((a) => a.questionId)))

        let available = await db
          .select()
          .from(questions)
          .where(
            usedIds.length > 0
              ? and(
                  eq(questions.materialId, materialId),
                  eq(questions.difficulty, session.currentDifficulty),
                  or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')),
                  notInArray(questions.id, usedIds)
                )
              : and(
                  eq(questions.materialId, materialId),
                  eq(questions.difficulty, session.currentDifficulty),
                  or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
                )
          )

        // Fallback: any unused
        if (available.length === 0) {
          available = await db
            .select()
            .from(questions)
            .where(
              usedIds.length > 0
                ? and(
                    eq(questions.materialId, materialId),
                    or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')),
                    notInArray(questions.id, usedIds)
                  )
                : and(
                    eq(questions.materialId, materialId),
                    or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
                  )
            )
        }

        // Fallback: allow repeats
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

        if (available.length > 0) {
          currentQuestion = available[Math.floor(Math.random() * available.length)]
          // Update session with the new question and reset remedial status
          await db
            .update(practiceSessions)
            .set({
              currentQuestionId: currentQuestion.id,
              status: 'ACTIVE',
              consecutiveWrong: 0,
            })
            .where(eq(practiceSessions.id, session.id))
        }
      }

      if (!currentQuestion) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Tidak ada soal tersedia' } },
          { status: 404 }
        )
      }

      // Get stats for this session
      const sessionAttempts = await db
        .select()
        .from(practiceAttempts)
        .where(eq(practiceAttempts.sessionId, session.id))

      const correctAnswers = sessionAttempts.filter((a) => a.isCorrect).length
      const totalAttempts = sessionAttempts.length

      // Return RESUMED session with current floor
      return NextResponse.json({
        sessionId: session.id,
        materialId,
        materialName: material?.title || 'Matematika',
        floor: session.floor,
        consecutiveWrong: session.status === 'REMEDIAL_REQUIRED' ? 0 : session.consecutiveWrong,
        currentDifficulty: session.currentDifficulty,
        difficultyLabel: DIFFICULTY_LABELS[session.currentDifficulty] || 'Sedang',
        mode: 'practice',
        question: formatQuestionForClient(currentQuestion),
        stats: { floorsClimbed: session.floor - 1, correctAnswers, totalAttempts },
        resumed: true,
      })
    }

    // ──────────────────────────────────────────────────────────────
    // NO ACTIVE SESSION — Create a brand new one
    // ──────────────────────────────────────────────────────────────
    const startDifficulty = 2
    let availableQuestions = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.materialId, materialId),
          eq(questions.difficulty, startDifficulty),
          or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
        )
      )

    if (availableQuestions.length === 0) {
      availableQuestions = await db
        .select()
        .from(questions)
        .where(
          and(
            eq(questions.materialId, materialId),
            or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
          )
        )
    }

    if (availableQuestions.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tidak ada soal latihan untuk materi ini' } },
        { status: 404 }
      )
    }

    const firstQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]

    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1)

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await db.insert(practiceSessions).values({
      id: sessionId,
      studentUserId: userId,
      materialId,
      floor: 1,
      consecutiveWrong: 0,
      currentDifficulty: firstQuestion.difficulty,
      currentQuestionId: firstQuestion.id,
      startedAt: new Date().toISOString(),
      status: 'ACTIVE',
    })

    return NextResponse.json({
      sessionId,
      materialId,
      materialName: material?.title || 'Matematika',
      floor: 1,
      consecutiveWrong: 0,
      currentDifficulty: firstQuestion.difficulty,
      difficultyLabel: DIFFICULTY_LABELS[firstQuestion.difficulty] || 'Sedang',
      mode: 'practice',
      question: formatQuestionForClient(firstQuestion),
      stats: { floorsClimbed: 0, correctAnswers: 0, totalAttempts: 0 },
    })
  } catch (error) {
    console.error('Start practice error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
