import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, attempts } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { materialId } = body
    const { mode } = body

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

    // If no materialId provided, auto-determine based on student progress
    if (!materialId) {
      const allMaterials = await db.select().from(materials).orderBy(materials.order)
      
      if (userId !== 'anonymous') {
        // Get total floors from completed sessions
        const [stats] = await db
          .select({ totalFloors: sql<number>`COALESCE(SUM(floor), 0)` })
          .from(practiceSessions)
          .where(eq(practiceSessions.studentUserId, userId))

        const totalFloors = stats?.totalFloors || 0
        const materialIndex = Math.min(Math.floor(totalFloors / 10), allMaterials.length - 1)
        materialId = allMaterials[materialIndex]?.id || allMaterials[0]?.id
      } else {
        materialId = allMaterials[0]?.id
      }
    }

    // Get questions for this material
    const materialQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.materialId, materialId))

    const material = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1)

    if (materialQuestions.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tidak ada soal untuk materi ini' } },
        { status: 404 }
      )
    }

    // Start with difficulty 2 (Sedang)
    const mediumQuestions = materialQuestions.filter((q) => q.difficulty === 2)
    const firstQuestion =
      mediumQuestions.length > 0
        ? mediumQuestions[Math.floor(Math.random() * mediumQuestions.length)]
        : materialQuestions[0]

    // Create session in database
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await db.insert(practiceSessions).values({
      id: sessionId,
      studentUserId: userId,
      materialId,
      floor: 1,
      wrongCount: 0,
      startedAt: new Date().toISOString(),
      status: 'ACTIVE',
    })

    // Return question with hints included
    const questionForClient = {
      id: firstQuestion.id,
      materialId: firstQuestion.materialId,
      difficulty: firstQuestion.difficulty,
      difficultyLabel: DIFFICULTY_LABELS[firstQuestion.difficulty] || 'Sedang',
      question: firstQuestion.question,
      optA: firstQuestion.optA,
      optB: firstQuestion.optB,
      optC: firstQuestion.optC,
      optD: firstQuestion.optD,
      hint1: firstQuestion.hint1,
      hint2: firstQuestion.hint2,
      hint3: firstQuestion.hint3,
    }

    return NextResponse.json({
      sessionId,
      materialId,
      materialName: material[0]?.title || 'Matematika',
      floor: 1,
      wrongCount: 0,
      mode: mode || 'practice',
      question: questionForClient,
    })
  } catch (error) {
    console.error('Start practice error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
