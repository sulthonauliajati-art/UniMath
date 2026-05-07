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

    const { sessionId, questionId, answer, responseMs } = await request.json()

    if (!sessionId || !questionId || !answer) {
      return NextResponse.json({ error: { message: 'Invalid data' } }, { status: 400 })
    }

    // Verify session
    const [session] = await db.select()
      .from(testSessions)
      .where(eq(testSessions.id, sessionId))

    if (!session) {
      return NextResponse.json({ error: { message: 'Session not found' } }, { status: 404 })
    }

    if (session.studentUserId !== tokenData.userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    if (session.completedAt) {
      return NextResponse.json({ error: { message: 'Test already completed' } }, { status: 403 })
    }

    // Check if already answered
    const [existingAttempt] = await db.select()
      .from(testAttempts)
      .where(and(eq(testAttempts.sessionId, sessionId), eq(testAttempts.questionId, questionId)))

    if (existingAttempt) {
       return NextResponse.json({ error: { message: 'Question already answered' } }, { status: 400 })
    }

    // Fetch question to check correct answer
    const [question] = await db.select()
      .from(questions)
      .where(eq(questions.id, questionId))

    if (!question) {
      return NextResponse.json({ error: { message: 'Question not found' } }, { status: 404 })
    }

    let isCorrect: boolean | null = null
    if (question.questionType === 'PG' || !question.questionType) {
      isCorrect = question.correct === answer
    }

    // Insert attempt
    await db.insert(testAttempts).values({
      id: `t_att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      questionId,
      answer: String(answer),
      isCorrect,
      responseMs: responseMs || 0,
      createdAt: new Date().toISOString()
    })

    // Notice we do NOT return isCorrect back to the client!
    return NextResponse.json({
      success: true
    })

  } catch (error) {
     console.error('Test answer error:', error)
     return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
