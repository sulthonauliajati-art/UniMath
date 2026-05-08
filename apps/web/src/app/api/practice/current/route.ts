import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, practiceAttempts } from '@/lib/db/schema'
import { eq, desc, and, or, notInArray } from 'drizzle-orm'

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

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')
    if (!userCookie) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    let userId = ''
    try {
      const user = JSON.parse(userCookie.value)
      userId = user.id
    } catch {
      return NextResponse.json({ error: { message: 'Invalid token' } }, { status: 401 })
    }

    // Find the latest active session
    const activeSessions = await db.select()
      .from(practiceSessions)
      .where(and(
        eq(practiceSessions.studentUserId, userId),
        eq(practiceSessions.status, 'ACTIVE')
      ))
      .orderBy(desc(practiceSessions.startedAt))
      .limit(1)

    if (activeSessions.length === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'No active session' } }, { status: 404 })
    }

    const session = activeSessions[0]

    // Fetch the material
    const [material] = await db.select().from(materials).where(eq(materials.id, session.materialId)).limit(1)

    // Fetch attempts for stats
    const sessionAttempts = await db.select()
      .from(practiceAttempts)
      .where(eq(practiceAttempts.sessionId, session.id))
      .orderBy(desc(practiceAttempts.createdAt))

    let currentQuestion = null

    // Try to resume with currentQuestionId stored in session
    if (session.currentQuestionId) {
      const questionRows = await db.select().from(questions)
        .where(eq(questions.id, session.currentQuestionId))
        .limit(1)
      if (questionRows.length > 0) {
        currentQuestion = questionRows[0]
      }
    }

    // If no currentQuestionId or not found, pick a new one
    if (!currentQuestion) {
      const usedQuestionIds = [...new Set(sessionAttempts.map(a => a.questionId))]
      const targetDifficulty = session.currentDifficulty || 2

      let available = await db.select().from(questions)
        .where(
          usedQuestionIds.length > 0
            ? and(
                eq(questions.materialId, session.materialId),
                eq(questions.difficulty, targetDifficulty),
                or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')),
                notInArray(questions.id, usedQuestionIds)
              )
            : and(
                eq(questions.materialId, session.materialId),
                eq(questions.difficulty, targetDifficulty),
                or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
              )
        )

      // Fallback: any unused PRACTICE question
      if (available.length === 0) {
        available = await db.select().from(questions)
          .where(
            usedQuestionIds.length > 0
              ? and(
                  eq(questions.materialId, session.materialId),
                  or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')),
                  notInArray(questions.id, usedQuestionIds)
                )
              : and(
                  eq(questions.materialId, session.materialId),
                  or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
                )
          )
      }

      // Fallback: allow repeats
      if (available.length === 0) {
        available = await db.select().from(questions)
          .where(
            and(
              eq(questions.materialId, session.materialId),
              or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
            )
          )
      }

      if (available.length > 0) {
        currentQuestion = available[Math.floor(Math.random() * available.length)]
        // Update session with the new question
        await db.update(practiceSessions)
          .set({ currentQuestionId: currentQuestion.id })
          .where(eq(practiceSessions.id, session.id))
      }
    }

    if (!currentQuestion) {
      return NextResponse.json({ error: { message: 'No questions available' } }, { status: 404 })
    }

    // Stats for the client
    const correctAnswers = sessionAttempts.filter(a => a.isCorrect).length
    const totalAttempts = sessionAttempts.length

    return NextResponse.json({
      sessionId: session.id,
      materialId: session.materialId,
      materialName: material?.title || 'Matematika',
      floor: session.floor,
      consecutiveWrong: session.consecutiveWrong,
      currentDifficulty: session.currentDifficulty,
      difficultyLabel: DIFFICULTY_LABELS[session.currentDifficulty] || 'Sedang',
      mode: 'practice',
      question: formatQuestionForClient(currentQuestion),
      stats: { floorsClimbed: session.floor - 1, correctAnswers, totalAttempts }
    })
  } catch (error) {
    console.error('Fetch current session error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
