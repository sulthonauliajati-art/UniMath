import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions } from '@/lib/db/schema'
import { eq, and, or } from 'drizzle-orm'

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
    // Hints are NOT sent on start — they only appear after wrong answers
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

    // Get PRACTICE-mode questions for this material at difficulty=2 (Sedang)
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

    // Fallback: if no Sedang questions, try any PRACTICE question
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

    // Pick a random question
    const firstQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]

    // Get material info
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1)

    // Create session in database
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await db.insert(practiceSessions).values({
      id: sessionId,
      studentUserId: userId,
      materialId,
      floor: 1,
      consecutiveWrong: 0,
      currentDifficulty: firstQuestion.difficulty, // actual difficulty of picked question
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
    })
  } catch (error) {
    console.error('Start practice error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
