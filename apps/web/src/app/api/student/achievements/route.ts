import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { achievements, studentAchievements, practiceSessions, attempts } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'STUDENT') {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const studentId = tokenData.userId!

    // Get all achievements
    const allAchievements = await db.select().from(achievements)

    // Get earned achievements
    const earnedAchievements = await db
      .select()
      .from(studentAchievements)
      .where(eq(studentAchievements.studentUserId, studentId))

    const earnedIds = new Set(earnedAchievements.map((ea) => ea.achievementId))

    // Get student stats for progress calculation
    const [sessionStats] = await db
      .select({
        totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
        totalSessions: sql<number>`count(*)`,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, studentId))

    const [attemptStats] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        correctAttempts: sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`,
      })
      .from(attempts)
      .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
      .where(eq(practiceSessions.studentUserId, studentId))

    const totalFloors = sessionStats?.totalFloors || 0
    const totalSessions = sessionStats?.totalSessions || 0
    const totalAttempts = attemptStats?.totalAttempts || 0
    const correctAttempts = attemptStats?.correctAttempts || 0
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    // Calculate progress for each achievement
    const achievementsWithProgress = allAchievements.map((ach) => {
      let current = 0
      if (ach.type === 'FLOOR') current = totalFloors
      else if (ach.type === 'ACCURACY') current = accuracy
      else if (ach.type === 'STREAK') current = totalSessions

      const progress = Math.min(100, Math.round((current / ach.requirement) * 100))
      const earned = earnedIds.has(ach.id)

      return {
        ...ach,
        earned,
        progress,
        current,
      }
    })

    // Check and award new achievements
    for (const ach of achievementsWithProgress) {
      if (!ach.earned && ach.progress >= 100) {
        try {
          await db.insert(studentAchievements).values({
            id: `SA${Date.now().toString(36)}`,
            studentUserId: studentId,
            achievementId: ach.id,
            earnedAt: new Date().toISOString(),
          })
          ach.earned = true
        } catch {
          // Ignore duplicate errors
        }
      }
    }

    return NextResponse.json({
      achievements: achievementsWithProgress,
      stats: { totalFloors, totalSessions, accuracy },
    })
  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
