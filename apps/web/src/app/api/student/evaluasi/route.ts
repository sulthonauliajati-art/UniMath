import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { testSessions, testAttempts, practiceSessions } from '@/lib/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { resolveAuthenticatedUserId } from '@/lib/auth/server'

const DELTA_FLOOR_REQUIRED = 25

/**
 * GET /api/student/evaluasi?materialId=...
 *
 * Returns evaluasi hub data:
 *   1. Pre-test & Post-test unlock status with delta floor info
 *   2. Riwayat evaluasi (session pairs with scores)
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

    // ── Current highest floor ────────────────────────────────────
    const [floorRow] = await db
      .select({
        highestFloor: sql<number>`COALESCE(MAX(floor), 1)`,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, userId))

    const currentFloor = floorRow?.highestFloor || 1

    // ── Latest completed Pre-test ─────────────────────────────────
    const [latestPretest] = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.studentUserId, userId),
          eq(testSessions.materialId, materialId),
          eq(testSessions.testType, 'PRETEST')
        )
      )
      .orderBy(desc(testSessions.pairOrdinal))
      .limit(1)

    const pretestUnlocked = true

    // ── Post-test unlock logic (Delta +25) ────────────────────────
    let posttestUnlocked = false
    let floorsRemaining = DELTA_FLOOR_REQUIRED
    let pretestFloor = 0

    if (latestPretest?.completedAt) {
      pretestFloor = latestPretest.floorAtCompletion || 0
      if (pretestFloor > 0) {
        const floorsGained = currentFloor - pretestFloor
        floorsRemaining = Math.max(0, DELTA_FLOOR_REQUIRED - floorsGained)
        posttestUnlocked = floorsGained >= DELTA_FLOOR_REQUIRED
      }
    }

    // Check if post-test for latest pair already completed
    const [latestPosttest] = latestPretest
      ? await db
          .select()
          .from(testSessions)
          .where(
            and(
              eq(testSessions.studentUserId, userId),
              eq(testSessions.materialId, materialId),
              eq(testSessions.testType, 'POSTTEST'),
              eq(testSessions.pairOrdinal, latestPretest.pairOrdinal)
            )
          )
          .limit(1)
      : [null]

    if (latestPosttest?.completedAt) {
      posttestUnlocked = false
    }

    // ── Riwayat Evaluasi ──────────────────────────────────────────
    const allTestSessions = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.studentUserId, userId),
          eq(testSessions.materialId, materialId)
        )
      )
      .orderBy(desc(testSessions.pairOrdinal))

    const pairOrdinals = new Set<number>()
    allTestSessions.forEach((s) => {
      if (s.pairOrdinal) pairOrdinals.add(s.pairOrdinal)
    })
    const sortedPairs = Array.from(pairOrdinals).sort((a, b) => b - a)

    const getScore = async (sessionId: string) => {
      const [scoreRow] = await db
        .select({
          total: sql<number>`count(*)`,
          correct: sql<number>`COALESCE(sum(case when is_correct = 1 then 1 else 0 end), 0)`,
        })
        .from(testAttempts)
        .where(eq(testAttempts.sessionId, sessionId))
      if (!scoreRow || scoreRow.total === 0) return null
      return Math.round((scoreRow.correct / scoreRow.total) * 100)
    }

    const history: Array<{
      sesi: number
      pretest: {
        sessionId: string
        startedAt: string
        completedAt: string | null
        score: number | null
        floorAtCompletion: number | null
      } | null
      posttest: {
        sessionId: string
        startedAt: string
        completedAt: string | null
        score: number | null
        floorAtCompletion: number | null
      } | null
    }> = []

    for (const pairOrdinal of sortedPairs) {
      const pretest = allTestSessions.find(
        (s) => s.testType === 'PRETEST' && s.pairOrdinal === pairOrdinal
      )
      const posttest = allTestSessions.find(
        (s) => s.testType === 'POSTTEST' && s.pairOrdinal === pairOrdinal
      )

      history.push({
        sesi: pairOrdinal,
        pretest: pretest
          ? {
              sessionId: pretest.id,
              startedAt: pretest.startedAt,
              completedAt: pretest.completedAt,
              score: pretest.completedAt ? await getScore(pretest.id) : null,
              floorAtCompletion: pretest.floorAtCompletion,
            }
          : null,
        posttest: posttest
          ? {
              sessionId: posttest.id,
              startedAt: posttest.startedAt,
              completedAt: posttest.completedAt,
              score: posttest.completedAt ? await getScore(posttest.id) : null,
              floorAtCompletion: posttest.floorAtCompletion,
            }
          : null,
      })
    }

    const nextPairOrdinal = sortedPairs.length > 0 ? sortedPairs[0] + 1 : 1

    return NextResponse.json({
      currentFloor,
      pretestUnlocked,
      posttestUnlocked,
      floorsRemaining,
      deltaRequired: DELTA_FLOOR_REQUIRED,
      pretestFloor,
      nextPairOrdinal,
      history,
    })
  } catch (error) {
    console.error('Evaluasi API error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Gagal memuat data evaluasi' } },
      { status: 500 }
    )
  }
}
