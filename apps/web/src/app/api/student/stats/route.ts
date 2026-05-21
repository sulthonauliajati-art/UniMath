import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, materials, practiceSessions, practiceAttempts } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token diperlukan' } },
        { status: 401 }
      )
    }

    // Validate token
    const tokenData = await validateToken(token)
    if (!tokenData.valid || !tokenData.userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token tidak valid' } },
        { status: 401 }
      )
    }

    const userId = tokenData.userId

    // Get session stats — use MAX(floor) as the single source of truth for
    // the student's highest floor ever reached.
    const [sessionStats] = await db
      .select({
        totalFloors: sql<number>`COALESCE(MAX(floor), 1)`,
        totalSessions: sql<number>`count(*)`,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, userId))

    // Get attempt stats
    const [attemptStats] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        correctAttempts: sql<number>`COALESCE(sum(case when is_correct = 1 then 1 else 0 end), 0)`,
      })
      .from(practiceAttempts)
      .innerJoin(practiceSessions, eq(practiceAttempts.sessionId, practiceSessions.id))
      .where(eq(practiceSessions.studentUserId, userId))

    const totalFloors = sessionStats?.totalFloors || 0
    const totalSessions = sessionStats?.totalSessions || 0
    const totalAttempts = attemptStats?.totalAttempts || 0
    const correctAttempts = attemptStats?.correctAttempts || 0
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    // Calculate rank in leaderboard
    const allStudents = await db
      .select({
        id: users.id,
        points: users.totalPoints,
      })
      .from(users)
      .where(eq(users.role, 'STUDENT'))

    const leaderboardStats = await Promise.all(
      allStudents.map(async (student) => {
        const [sStats] = await db
          .select({
            totalFloors: sql<number>`COALESCE(MAX(floor), 1)`,
          })
          .from(practiceSessions)
          .where(eq(practiceSessions.studentUserId, student.id))

        return {
          id: student.id,
          points: student.points || 0,
          totalFloors: sStats?.totalFloors || 1,
        }
      })
    )

    // Sort by points (XP) descending, then totalFloors descending
    leaderboardStats.sort((a, b) => b.points - a.points || b.totalFloors - a.totalFloors)
    const rank = leaderboardStats.findIndex((s) => s.id === userId) + 1

    // Get all materials
    const allMaterials = await db.select().from(materials).orderBy(materials.order)

    // Get progress per material
    const materialProgress = await Promise.all(
      allMaterials.map(async (material) => {
        // Get highest floor for this material
        const [matStats] = await db
          .select({
            highestFloor: sql<number>`COALESCE(MAX(floor), 1)`,
          })
          .from(practiceSessions)
          .where(
            sql`${practiceSessions.studentUserId} = ${userId} AND ${practiceSessions.materialId} = ${material.id}`
          )

        // Progress is based on highest floor (10 floors = 100%)
        const highestFloor = matStats?.highestFloor || 1
        const progress = Math.min(Math.round(((highestFloor - 1) / 10) * 100), 100)

        return {
          id: material.id,
          name: material.title,
          progress,
        }
      })
    )

    return NextResponse.json({
      stats: {
        totalFloors,
        totalSessions,
        totalAttempts,
        correctAttempts,
        accuracy,
        rank,
      },
      materialProgress,
    })
  } catch (error) {
    console.error('Get student stats error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
