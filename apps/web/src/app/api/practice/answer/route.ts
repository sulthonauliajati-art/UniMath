import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, attempts } from '@/lib/db/schema'
import { eq, and, notInArray } from 'drizzle-orm'

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

async function getNewQuestion(
  materialId: string,
  difficulty: number,
  excludeIds: string[]
) {
  // Get questions at exact difficulty, excluding used ones
  let availableQuestions = await db
    .select()
    .from(questions)
    .where(
      excludeIds.length > 0
        ? and(
            eq(questions.materialId, materialId),
            eq(questions.difficulty, difficulty),
            notInArray(questions.id, excludeIds)
          )
        : and(eq(questions.materialId, materialId), eq(questions.difficulty, difficulty))
    )

  // If no questions at exact difficulty, try any difficulty
  if (availableQuestions.length === 0) {
    availableQuestions = await db
      .select()
      .from(questions)
      .where(
        excludeIds.length > 0
          ? and(eq(questions.materialId, materialId), notInArray(questions.id, excludeIds))
          : eq(questions.materialId, materialId)
      )
  }

  // If still no questions, reset and get any
  if (availableQuestions.length === 0) {
    availableQuestions = await db
      .select()
      .from(questions)
      .where(and(eq(questions.materialId, materialId), eq(questions.difficulty, difficulty)))
  }

  if (availableQuestions.length === 0) return null

  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
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


export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, answer, responseMs } = await request.json()

    if (!sessionId || !questionId || !answer) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Data tidak lengkap' } },
        { status: 400 }
      )
    }

    // Get question
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

    // Get session
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

    // Get used question IDs from attempts
    const usedAttempts = await db
      .select({ questionId: attempts.questionId })
      .from(attempts)
      .where(eq(attempts.sessionId, sessionId))

    const usedQuestionIds = usedAttempts.map((a) => a.questionId)
    usedQuestionIds.push(questionId)

    // Save attempt
    await db.insert(attempts).values({
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      floor: session.floor,
      questionId,
      answer: answer as 'A' | 'B' | 'C' | 'D',
      isCorrect,
      responseMs: responseMs || 0,
      createdAt: new Date().toISOString(),
    })

    // Get material for name
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, session.materialId))
      .limit(1)

    // Determine current difficulty from question
    let currentDifficulty = question.difficulty

    if (isCorrect) {
      // Correct answer - move to next floor
      const newFloor = session.floor + 1
      
      await db
        .update(practiceSessions)
        .set({ floor: newFloor, wrongCount: 0 })
        .where(eq(practiceSessions.id, sessionId))

      // After correct: Sedang → Sulit, Sulit → tetap Sulit
      const nextDifficulty = currentDifficulty >= 2 ? 3 : 2
      const nextQ = await getNewQuestion(session.materialId, nextDifficulty, usedQuestionIds)

      return NextResponse.json({
        isCorrect: true,
        floor: newFloor,
        wrongCount: 0,
        nextQuestion: nextQ ? formatQuestionForClient(nextQ) : null,
      })
    } else {
      // Wrong answer - student stays on SAME question until correct or 4 wrong
      const newWrongCount = session.wrongCount + 1

      await db
        .update(practiceSessions)
        .set({ wrongCount: newWrongCount })
        .where(eq(practiceSessions.id, sessionId))

      if (newWrongCount >= 4) {
        // Wrong 4 times on same question - must go to materials
        await db
          .update(practiceSessions)
          .set({ status: 'ABANDONED', endedAt: new Date().toISOString() })
          .where(eq(practiceSessions.id, sessionId))

        return NextResponse.json({
          isCorrect: false,
          floor: session.floor,
          wrongCount: newWrongCount,
          mustStudy: true,
          materialId: session.materialId,
          materialName: material?.title || 'Materi',
          explanation: question.explanation,
          message: 'Kamu perlu belajar materi dulu sebelum melanjutkan',
        })
      }

      // Return SAME question with updated hints visible
      // Hint 1 shown after 1st wrong, Hint 2 after 2nd, Hint 3 after 3rd
      return NextResponse.json({
        isCorrect: false,
        floor: session.floor,
        wrongCount: newWrongCount,
        // Return same question - frontend will show hints based on wrongCount
        sameQuestion: true,
        hint: newWrongCount === 1 ? question.hint1 : 
              newWrongCount === 2 ? question.hint2 : 
              newWrongCount === 3 ? question.hint3 : null,
      })
    }
  } catch (error) {
    console.error('Answer error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
