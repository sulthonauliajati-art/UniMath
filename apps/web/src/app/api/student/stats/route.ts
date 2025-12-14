import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials, practiceSessions, attempts } from '@/lib/db/schema'
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

    // Get session stats
    const [sessionStats] = await db
      .select({
        totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
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
      .from(attempts)
      .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
      .where(eq(practiceSessions.studentUserId, userId))

    const totalFloors = sessionStats?.totalFloors || 0
    const totalSessions = sessionStats?.totalSessions || 0
    const totalAttempts = attemptStats?.totalAttempts || 0
    const correctAttempts = attemptStats?.correctAttempts || 0
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    // Get all materials
    const allMaterials = await db.select().from(materials).orderBy(materials.order)

    // Get progress per material
    const materialProgress = await Promise.all(
      allMaterials.map(async (material) => {
        // Get floors completed for this material
        const [matStats] = await db
          .select({
            floorsCompleted: sql<number>`COALESCE(SUM(floor - 1), 0)`,
          })
          .from(practiceSessions)
          .where(
            sql`${practiceSessions.studentUserId} = ${userId} AND ${practiceSessions.materialId} = ${material.id}`
          )

        // Progress is based on floors (10 floors = 100%)
        const floorsCompleted = matStats?.floorsCompleted || 0
        const progress = Math.min(Math.round((floorsCompleted / 10) * 100), 100)

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
