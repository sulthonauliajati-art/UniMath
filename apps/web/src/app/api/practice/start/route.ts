import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, practiceAttempts } from '@/lib/db/schema'
import { eq, and, or, desc, notInArray, sql } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

function formatQuestionForClient(q: typeof questions.$inferSelect) {
  return {
    id: q.id,
    materialId: q.materialId,
    difficulty: q.difficulty,
    difficultyLabel: DIFFICULTY_LABELS[q.difficulty] || 'Sedang',
    question: q.question,
    optA: q.optA,
    optB: q.optB,
    optC: q.optC,
    optD: q.optD,
    optE: q.optE || '',
  }
}

/**
 * Resolve authenticated user ID dari:
 * 1. Authorization header (Bearer token) — diutamakan
 * 2. Cookie 'auth_token'
 * 3. Cookie 'user' (legacy) — hanya sebagai fallback dengan validasi
 * 
 * Return null jika tidak ada user yang valid.
 */
async function resolveAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  // 1. Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    if (token) {
      const t = await validateToken(token)
      if (t.valid && t.userId) return t.userId
    }
  }

  // 2. Cookie 'auth_token' (server-set token)
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')
  if (authToken?.value) {
    const t = await validateToken(authToken.value)
    if (t.valid && t.userId) return t.userId
  }

  // 2b. Cookie 'token' (client-set oleh AuthContext login())
  const tokenCookie = cookieStore.get('token')
  if (tokenCookie?.value) {
    const t = await validateToken(tokenCookie.value)
    if (t.valid && t.userId) return t.userId
  }

  // 3. Cookie 'user' legacy — parse and validate format
  const userCookie = cookieStore.get('user')
  if (userCookie?.value) {
    try {
      const user = JSON.parse(userCookie.value)
      // Pastikan ID tidak 'anonymous' dan punya format yang valid
      if (user.id && typeof user.id === 'string' && user.id !== 'anonymous' && user.id.length > 0) {
        return user.id
      }
    } catch {
      // invalid JSON — ignore
    }
  }

  return null
}

async function getNewQuestion(
  materialId: string,
  difficulty: number,
  excludeIds: string[]
) {
  // Try exact difficulty first, excluding used
  let available = await db
    .select()
    .from(questions)
    .where(
      excludeIds.length > 0
        ? and(
            eq(questions.materialId, materialId),
            eq(questions.difficulty, difficulty),
            or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')),
            notInArray(questions.id, excludeIds)
          )
        : and(
            eq(questions.materialId, materialId),
            eq(questions.difficulty, difficulty),
            or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
          )
    )

  // Fallback: any unused question
  if (available.length === 0) {
    available = await db
      .select()
      .from(questions)
      .where(
        excludeIds.length > 0
          ? and(
              eq(questions.materialId, materialId),
              or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')),
              notInArray(questions.id, excludeIds)
            )
          : and(
              eq(questions.materialId, materialId),
              or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
            )
      )
  }

  // Fallback: allow repeats
  if (available.length === 0) {
    available = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.materialId, materialId),
          or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
        )
      )
  }

  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { materialId } = body

    // ── AUTH: Wajib ada user yang terautentikasi ──────────────────────────
    const userId = await resolveAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Kamu harus login untuk memulai latihan' } },
        { status: 401 }
      )
    }

    // If no materialId provided, use first active material
    if (!materialId) {
      const allMaterials = await db
        .select()
        .from(materials)
        .where(eq(materials.isActive, true))
        .orderBy(materials.order)
      materialId = allMaterials[0]?.id
    }

    if (!materialId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tidak ada materi tersedia' } },
        { status: 404 }
      )
    }

    // ── CHECK FOR EXISTING ACTIVE SESSION — Resume if found ──────────────
    const existingSessions = await db
      .select()
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.studentUserId, userId),
          eq(practiceSessions.materialId, materialId),
          or(
            eq(practiceSessions.status, 'ACTIVE'),
            eq(practiceSessions.status, 'REMEDIAL_REQUIRED')
          )
        )
      )
      .orderBy(desc(practiceSessions.startedAt))
      .limit(1)

    if (existingSessions.length > 0) {
      const session = existingSessions[0]

      const [material] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, materialId))
        .limit(1)

      // Try to get the current question from the session
      let currentQuestion = null
      if (session.currentQuestionId) {
        const [q] = await db
          .select()
          .from(questions)
          .where(eq(questions.id, session.currentQuestionId))
          .limit(1)
        currentQuestion = q || null
      }

      // If no current question (e.g., after remedial), pick a new one
      if (!currentQuestion) {
        const usedAttempts = await db
          .select({ questionId: practiceAttempts.questionId })
          .from(practiceAttempts)
          .where(eq(practiceAttempts.sessionId, session.id))
        const usedIds = Array.from(new Set(usedAttempts.map((a) => a.questionId)))

        const newQ = await getNewQuestion(materialId, session.currentDifficulty, usedIds)

        if (newQ) {
          currentQuestion = newQ
          // Update session: reset remedial status, assign new question
          await db
            .update(practiceSessions)
            .set({
              currentQuestionId: currentQuestion.id,
              status: 'ACTIVE',
              consecutiveWrong: 0,
            })
            .where(eq(practiceSessions.id, session.id))
        }
      }

      if (!currentQuestion) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Tidak ada soal tersedia untuk materi ini' } },
          { status: 404 }
        )
      }

      // Get session attempt stats
      const sessionAttempts = await db
        .select()
        .from(practiceAttempts)
        .where(eq(practiceAttempts.sessionId, session.id))

      const correctAnswers = sessionAttempts.filter((a) => a.isCorrect).length
      const totalAttempts = sessionAttempts.length

      return NextResponse.json({
        sessionId: session.id,
        materialId,
        materialName: material?.title || 'Matematika',
        floor: session.floor,
        consecutiveWrong: session.status === 'REMEDIAL_REQUIRED' ? 0 : session.consecutiveWrong,
        currentDifficulty: session.currentDifficulty,
        difficultyLabel: DIFFICULTY_LABELS[session.currentDifficulty] || 'Sedang',
        // ✅ FIX: Kembalikan currentStreak saat resume — bukan 0
        currentStreak: session.currentStreak || 0,
        mode: 'practice',
        question: formatQuestionForClient(currentQuestion),
        stats: { floorsClimbed: session.floor - 1, correctAnswers, totalAttempts },
        resumed: true,
      })
    }

    // ── NO ACTIVE SESSION — Create a brand new one ────────────────────────
    // Start from the student's HIGHEST floor ever reached for this material
    const [highestFloorRow] = await db
      .select({
        maxFloor: sql<number>`COALESCE(MAX(floor), 1)`,
      })
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.studentUserId, userId),
          eq(practiceSessions.materialId, materialId)
        )
      )

    const startingFloor = highestFloorRow?.maxFloor || 1

    const startDifficulty = 2
    let availableQuestions = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.materialId, materialId),
          eq(questions.difficulty, startDifficulty),
          or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
        )
      )

    if (availableQuestions.length === 0) {
      availableQuestions = await db
        .select()
        .from(questions)
        .where(
          and(
            eq(questions.materialId, materialId),
            or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
          )
        )
    }

    if (availableQuestions.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tidak ada soal latihan untuk materi ini' } },
        { status: 404 }
      )
    }

    const firstQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]

    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1)

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await db.insert(practiceSessions).values({
      id: sessionId,
      studentUserId: userId,
      materialId,
      floor: startingFloor,
      consecutiveWrong: 0,
      currentDifficulty: firstQuestion.difficulty,
      currentStreak: 0,
      currentQuestionId: firstQuestion.id,
      startedAt: new Date().toISOString(),
      status: 'ACTIVE',
    })

    return NextResponse.json({
      sessionId,
      materialId,
      materialName: material?.title || 'Matematika',
      floor: startingFloor,
      consecutiveWrong: 0,
      currentDifficulty: firstQuestion.difficulty,
      difficultyLabel: DIFFICULTY_LABELS[firstQuestion.difficulty] || 'Sedang',
      currentStreak: 0,
      mode: 'practice',
      question: formatQuestionForClient(firstQuestion),
      stats: { floorsClimbed: startingFloor - 1, correctAnswers: 0, totalAttempts: 0 },
    })
  } catch (error) {
    console.error('Start practice error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
