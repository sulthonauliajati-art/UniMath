import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { testSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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

    if (session.studentUserId !== tokenData.userId) {
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
