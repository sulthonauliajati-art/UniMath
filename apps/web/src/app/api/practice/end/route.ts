import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { practiceSessions, attempts } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Session ID diperlukan' } },
        { status: 400 }
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

    // Get stats from attempts
    const [attemptStats] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        correctAnswers: sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`,
      })
      .from(attempts)
      .where(eq(attempts.sessionId, sessionId))

    // Update session status
    await db
      .update(practiceSessions)
      .set({
        status: reason === 'completed' ? 'COMPLETED' : 'ABANDONED',
        endedAt: new Date().toISOString(),
      })
      .where(eq(practiceSessions.id, sessionId))

    return NextResponse.json({
      success: true,
      stats: {
        floorsClimbed: session.floor - 1,
        correctAnswers: attemptStats?.correctAnswers || 0,
        totalAttempts: attemptStats?.totalAttempts || 0,
      },
    })
  } catch (error) {
    console.error('End practice error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
