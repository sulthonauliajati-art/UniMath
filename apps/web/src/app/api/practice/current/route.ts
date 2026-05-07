import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, practiceAttempts } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

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
    hint1: q.hint1,
    hint2: q.hint2,
    hint3: q.hint3,
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
    const material = await db.select().from(materials).where(eq(materials.id, session.materialId)).limit(1)
    
    // Fetch attempts
    const sessionAttempts = await db.select()
      .from(practiceAttempts)
      .where(eq(practiceAttempts.sessionId, session.id))
      .orderBy(desc(practiceAttempts.createdAt))

    let currentQuestion = null

    if (session.wrongCount > 0 && sessionAttempts.length > 0) {
      // User is currently stuck on a question, retrieve the last attempted question
      const lastAttempt = sessionAttempts[0]
      const questionRows = await db.select().from(questions).where(eq(questions.id, lastAttempt.questionId)).limit(1)
      if (questionRows.length > 0) {
        currentQuestion = questionRows[0]
      }
    }

    if (!currentQuestion) {
      // Need a new question. Get used correct ones to exclude.
      const usedQuestionIds = sessionAttempts.filter(a => a.isCorrect).map(a => a.questionId)
      const targetDifficulty = session.floor >= 10 ? 3 : session.floor >= 5 ? 2 : 1
      
      let availableQuestions = await db.select().from(questions)
        .where(eq(questions.materialId, session.materialId))
      
      let unusedQuestions = availableQuestions.filter(q => !usedQuestionIds.includes(q.id))
      if (unusedQuestions.length === 0) {
        unusedQuestions = availableQuestions // reset if all used
      }
      
      const difficultyMatch = unusedQuestions.filter(q => q.difficulty === targetDifficulty)
      
      if (difficultyMatch.length > 0) {
        currentQuestion = difficultyMatch[Math.floor(Math.random() * difficultyMatch.length)]
      } else if (unusedQuestions.length > 0) {
        currentQuestion = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)]
      } else if (availableQuestions.length > 0) {
        currentQuestion = availableQuestions[0]
      }
    }

    if (!currentQuestion) {
      return NextResponse.json({ error: { message: 'No questions available' } }, { status: 404 })
    }

    // Add hints based on wrongCount
    const formattedQuestion = formatQuestionForClient(currentQuestion)
    if (session.wrongCount < 1) formattedQuestion.hint1 = null
    if (session.wrongCount < 2) formattedQuestion.hint2 = null
    if (session.wrongCount < 3) formattedQuestion.hint3 = null

    // Stats for resuming
    const correctAnswers = sessionAttempts.filter(a => a.isCorrect).length
    const totalAttempts = sessionAttempts.length

    return NextResponse.json({
      sessionId: session.id,
      materialId: session.materialId,
      materialName: material[0]?.title || 'Matematika',
      floor: session.floor,
      wrongCount: session.wrongCount,
      mode: 'practice',
      question: formattedQuestion,
      stats: { floorsClimbed: session.floor - 1, correctAnswers, totalAttempts }
    })
  } catch (error) {
    console.error('Fetch current session error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
