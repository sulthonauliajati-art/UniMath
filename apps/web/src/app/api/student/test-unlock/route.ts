import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { practiceSessions, testSessions } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { resolveAuthenticatedUserId } from '@/lib/auth/server'

/**
 * GET /api/student/test-unlock?materialId=...
 *
 * Returns unlock status for Pre-test and Post-test.
 * - Pre-test: always unlocked
 * - Post-test: unlocked if Pre-test COMPLETED + highest floor >= 25
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Silakan login' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId') || 'M1A'
    const FLOOR_REQUIREMENT = 25

    // Check Pre-test completion
    const [pretestSession] = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.studentUserId, userId),
          eq(testSessions.materialId, materialId),
          eq(testSessions.testType, 'PRETEST')
        )
      )
      .limit(1)

    const pretestCompleted = !!(pretestSession?.completedAt)

    // Check highest floor
    const [floorResult] = await db
      .select({
        highestFloor: sql<number>`COALESCE(MAX(floor), 1)`,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, userId))

    const highestFloor = floorResult?.highestFloor || 1

    // Check if Post-test already completed (keeps it accessible)
    const [posttestSession] = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.studentUserId, userId),
          eq(testSessions.materialId, materialId),
          eq(testSessions.testType, 'POSTTEST')
        )
      )
      .limit(1)

    const posttestCompleted = !!(posttestSession?.completedAt)

    const pretestUnlocked = true
    const posttestUnlocked = posttestCompleted || (pretestCompleted && highestFloor >= FLOOR_REQUIREMENT)

    return NextResponse.json({
      pretestUnlocked,
      posttestUnlocked,
      pretestCompleted,
      posttestCompleted,
      highestFloor,
      floorRequirement: FLOOR_REQUIREMENT,
      floorMet: highestFloor >= FLOOR_REQUIREMENT,
    })
  } catch (error) {
    console.error('Test unlock check error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Gagal memeriksa status tes' } },
      { status: 500 }
    )
  }
}
