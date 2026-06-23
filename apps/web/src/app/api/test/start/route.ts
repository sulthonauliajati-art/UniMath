import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, testSessions, testAttempts, practiceSessions } from '@/lib/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { resolveAuthenticatedUserId } from '@/lib/auth/server'

const DELTA_FLOOR_REQUIRED = 25

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const { materialId, testType } = await request.json()
    if (!materialId || !['PRETEST', 'POSTTEST'].includes(testType)) {
      return NextResponse.json({ error: { message: 'Invalid data' } }, { status: 400 })
    }

    const [floorRow] = await db
      .select({ highestFloor: sql<number>`COALESCE(MAX(floor), 1)` })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, userId))
    const currentFloor = floorRow?.highestFloor || 1

    if (testType === 'PRETEST') {
      // ═══════════════════════════════════════════
      // PRE-TEST: Selalu sesi BARU — Sesi 1, 2, …
      // ═══════════════════════════════════════════
      const [lastPretest] = await db
        .select({ maxOrdinal: sql<number>`COALESCE(MAX(pair_ordinal), 0)` })
        .from(testSessions)
        .where(
          and(
            eq(testSessions.studentUserId, userId),
            eq(testSessions.materialId, materialId),
            eq(testSessions.testType, 'PRETEST')
          )
        )
      const nextPairOrdinal = (lastPretest?.maxOrdinal || 0) + 1
      const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await db.insert(testSessions).values({
        id: sessionId,
        studentUserId: userId,
        materialId,
        testType: 'PRETEST',
        pairOrdinal: nextPairOrdinal,
        startedAt: new Date().toISOString(),
      })

      let allQ = await db.select().from(questions).where(
        and(eq(questions.materialId, materialId), eq(questions.mode, 'PRETEST'))
      )
      if (allQ.length === 0) {
        allQ = await db.select().from(questions).where(
          and(eq(questions.materialId, materialId), eq(questions.mode, 'ALL'))
        )
      }
      const testQuestions = allQ.map((q) => {
        const { correct, hint1, hint2, hint3, explanation, remedialMaterialId, ...safe } = q
        return safe
      })

      return NextResponse.json({
        sessionId, startedAt: new Date().toISOString(),
        questions: testQuestions, answeredQuestionIds: [] as string[],
        pairOrdinal: nextPairOrdinal,
      })
    }

    // ═══════════════════════════════════════════
    // POST-TEST: Validasi Delta +25 Lantai
    // ═══════════════════════════════════════════
    const [latestPretest] = await db.select().from(testSessions).where(
      and(
        eq(testSessions.studentUserId, userId),
        eq(testSessions.materialId, materialId),
        eq(testSessions.testType, 'PRETEST')
      )
    ).orderBy(desc(testSessions.pairOrdinal)).limit(1)

    if (!latestPretest) {
      return NextResponse.json({
        error: { code: 'NO_PRETEST', message: 'Kamu harus menyelesaikan Pre-test terlebih dahulu.' }
      }, { status: 403 })
    }
    if (!latestPretest.completedAt) {
      return NextResponse.json({
        error: { code: 'PRETEST_NOT_COMPLETED', message: 'Selesaikan Pre-test dulu ya!' }
      }, { status: 403 })
    }

    const pretestFloor = latestPretest.floorAtCompletion || 0
    if (pretestFloor <= 0) {
      return NextResponse.json({
        error: { code: 'NO_FLOOR_DATA', message: 'Data lantai Pre-test tidak ditemukan.' }
      }, { status: 500 })
    }

    const floorsGained = currentFloor - pretestFloor
    if (floorsGained < DELTA_FLOOR_REQUIRED) {
      const remaining = DELTA_FLOOR_REQUIRED - floorsGained
      return NextResponse.json({
        error: {
          code: 'FLOOR_REQUIREMENT_NOT_MET',
          message: `Naik ${DELTA_FLOOR_REQUIRED} lantai sejak Pre-test. Baru +${floorsGained}. Latih ${remaining} lantai lagi.`,
        },
        floorsGained, floorsRemaining: remaining, pretestFloor, currentFloor,
      }, { status: 403 })
    }

    // Cek apakah post-test untuk pair ini sudah ada
    const [existingPosttest] = await db.select().from(testSessions).where(
      and(
        eq(testSessions.studentUserId, userId),
        eq(testSessions.materialId, materialId),
        eq(testSessions.testType, 'POSTTEST'),
        eq(testSessions.pairOrdinal, latestPretest.pairOrdinal)
      )
    ).limit(1)

    let sessionId: string
    if (existingPosttest) {
      if (existingPosttest.completedAt) {
        return NextResponse.json({
          error: { code: 'POSTTEST_ALREADY_COMPLETED', message: 'Post-test sesi ini sudah selesai.' }
        }, { status: 403 })
      }
      sessionId = existingPosttest.id
    } else {
      sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await db.insert(testSessions).values({
        id: sessionId, studentUserId: userId, materialId,
        testType: 'POSTTEST', pairOrdinal: latestPretest.pairOrdinal,
        startedAt: new Date().toISOString(),
      })
    }

    let allQ = await db.select().from(questions).where(
      and(eq(questions.materialId, materialId), eq(questions.mode, 'POSTTEST'))
    )
    if (allQ.length === 0) {
      allQ = await db.select().from(questions).where(
        and(eq(questions.materialId, materialId), eq(questions.mode, 'ALL'))
      )
    }
    const testQuestions = allQ.map((q) => {
      const { correct, hint1, hint2, hint3, explanation, remedialMaterialId, ...safe } = q
      return safe
    })

    const attempts = await db.select().from(testAttempts).where(eq(testAttempts.sessionId, sessionId))

    return NextResponse.json({
      sessionId, startedAt: existingPosttest?.startedAt || new Date().toISOString(),
      questions: testQuestions, answeredQuestionIds: attempts.map(a => a.questionId),
      pairOrdinal: latestPretest.pairOrdinal,
    })
  } catch (error) {
    console.error('Test start error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
