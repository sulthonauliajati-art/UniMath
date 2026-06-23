import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { testSessions, practiceSessions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { resolveAuthenticatedUserId } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: { message: 'Session ID is required' } }, { status: 400 })
    }

    const [session] = await db.select().from(testSessions).where(eq(testSessions.id, sessionId))
    if (!session) {
      return NextResponse.json({ error: { message: 'Session not found' } }, { status: 404 })
    }
    if (session.studentUserId !== userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }
    if (session.completedAt) {
      return NextResponse.json({ error: { message: 'Test already completed' } }, { status: 400 })
    }

    // Rekam lantai tertinggi saat ujian selesai — untuk kalkulasi delta Post-test
    const [floorRow] = await db
      .select({ highestFloor: sql<number>`COALESCE(MAX(floor), 1)` })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, userId))

    const floorAtCompletion = floorRow?.highestFloor || 1

    await db.update(testSessions)
      .set({
        completedAt: new Date().toISOString(),
        floorAtCompletion,
      })
      .where(eq(testSessions.id, sessionId))

    return NextResponse.json({ success: true, floorAtCompletion })
  } catch (error) {
    console.error('Test finish error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
