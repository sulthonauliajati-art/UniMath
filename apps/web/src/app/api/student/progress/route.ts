import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials, practiceSessions, practiceAttempts, users } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { resolveAuthenticatedUserId } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Silakan login terlebih dahulu' } },
        { status: 401 }
      )
    }

    // Get the student's HIGHEST floor ever reached (the single source of truth
    // for "lantai saat ini"). This is the MAX(floor) across ALL sessions
    // regardless of material, so progress is never lost.
    const [floorStats] = await db
      .select({
        highestFloor: sql<number>`COALESCE(MAX(floor), 1)`,
        totalSessions: sql<number>`count(*)`,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, userId))

    // Get accuracy from practiceAttempts
    const [attemptStats] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        correctAttempts: sql<number>`COALESCE(sum(case when is_correct = 1 then 1 else 0 end), 0)`,
      })
      .from(practiceAttempts)
      .innerJoin(practiceSessions, eq(practiceAttempts.sessionId, practiceSessions.id))
      .where(eq(practiceSessions.studentUserId, userId))

    const currentFloor = floorStats?.highestFloor || 1
    const totalSessions = floorStats?.totalSessions || 0
    const totalAttempts = attemptStats?.totalAttempts || 0
    const correctAttempts = attemptStats?.correctAttempts || 0
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    // Get user's total XP points
    const [userData] = await db
      .select({ totalPoints: users.totalPoints })
      .from(users)
      .where(eq(users.id, userId))
    const totalXP = userData?.totalPoints || 0

    // Get all materials
    const allMaterials = await db.select().from(materials).orderBy(materials.order)

    // Determine current material based on highest floor
    // Every 10 floors = next material
    const materialIndex = Math.min(Math.floor((currentFloor - 1) / 10), allMaterials.length - 1)
    const currentMaterial = allMaterials[materialIndex] || allMaterials[0]

    return NextResponse.json({
      currentFloor,
      totalFloors: currentFloor,
      currentMaterial: currentMaterial?.title || 'Matematika',
      currentMaterialId: currentMaterial?.id || 'M1A',
      accuracy,
      totalSessions,
      totalXP,
    })
  } catch (error) {
    console.error('Student progress error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Gagal memuat data progres' } },
      { status: 500 }
    )
  }
}
