import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { questions, testSessions, testAttempts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get('token')?.value
    }

    if (!token) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'STUDENT') {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { materialId, testType } = await request.json()

    if (!materialId || !['PRETEST', 'POSTTEST'].includes(testType)) {
      return NextResponse.json({ error: { message: 'Invalid data' } }, { status: 400 })
    }

    // Check existing
    const existing = await db.select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.studentUserId, tokenData.userId!),
          eq(testSessions.materialId, materialId),
          eq(testSessions.testType, testType)
        )
      )

    let session = existing[0]

    if (session) {
      if (session.completedAt) {
         return NextResponse.json({ error: { message: 'TEST_ALREADY_COMPLETED' } }, { status: 403 })
      }
    } else {
      // Create new
      const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await db.insert(testSessions).values({
        id,
        studentUserId: tokenData.userId!,
        materialId,
        testType,
        startedAt: new Date().toISOString()
      })
      session = {
        id,
        studentUserId: tokenData.userId!,
        materialId,
        testType,
        startedAt: new Date().toISOString(),
        completedAt: null
      } as any
    }

    // Fetch questions
    let allQuestions = await db.select()
      .from(questions)
      .where(and(eq(questions.materialId, materialId), eq(questions.mode, testType)))

    if (allQuestions.length === 0) {
      allQuestions = await db.select()
        .from(questions)
        .where(and(eq(questions.materialId, materialId), eq(questions.mode, 'ALL')))
    }

    // Strip answers and hints for strict mode
    const testQuestions = allQuestions.map(q => {
      const { correct, hint1, hint2, hint3, explanation, remedialMaterialId, ...safeQuestion } = q
      return safeQuestion
    })

    // Get answered
    const attempts = await db.select()
       .from(testAttempts)
       .where(eq(testAttempts.sessionId, session.id))
       
    return NextResponse.json({
       sessionId: session.id,
       startedAt: session.startedAt,
       questions: testQuestions,
       answeredQuestionIds: attempts.map(a => a.questionId)
    })

  } catch (error) {
     console.error('Test start error:', error)
     return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
