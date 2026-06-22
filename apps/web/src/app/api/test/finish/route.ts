import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { testSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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

    // Verify session
    const [session] = await db.select()
      .from(testSessions)
      .where(eq(testSessions.id, sessionId))

    if (!session) {
      return NextResponse.json({ error: { message: 'Session not found' } }, { status: 404 })
    }

    if (session.studentUserId !== userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    if (session.completedAt) {
      return NextResponse.json({ error: { message: 'Test already completed' } }, { status: 400 })
    }

    // Mark as completed
    await db.update(testSessions)
      .set({ completedAt: new Date().toISOString() })
      .where(eq(testSessions.id, sessionId))

    return NextResponse.json({
      success: true
    })

  } catch (error) {
     console.error('Test finish error:', error)
     return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
