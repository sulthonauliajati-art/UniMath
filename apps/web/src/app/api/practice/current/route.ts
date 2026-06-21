import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { questions, materials, practiceSessions, practiceAttempts } from '@/lib/db/schema'
import { eq, desc, and, or } from 'drizzle-orm'

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
 * ⚡ OPTIMASI: Sama dengan getNewQuestion di answer/route.ts
 * 1 query → filter di memori. Eliminasi 3 DB round-trips.
 */
async function pickQuestion(
  materialId: string,
  difficulty: number,
  usedIds: Set<string>
) {
  const allQ = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.materialId, materialId),
        or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL'))
      )
    )

  if (allQ.length === 0) return null

  const atTargetUnused = allQ.filter(q => q.difficulty === difficulty && !usedIds.has(q.id))
  if (atTargetUnused.length > 0) return atTargetUnused[Math.floor(Math.random() * atTargetUnused.length)]

  const anyUnused = allQ.filter(q => !usedIds.has(q.id))
  if (anyUnused.length > 0) return anyUnused[Math.floor(Math.random() * anyUnused.length)]

  const atTarget = allQ.filter(q => q.difficulty === difficulty)
  if (atTarget.length > 0) return atTarget[Math.floor(Math.random() * atTarget.length)]

  return allQ[Math.floor(Math.random() * allQ.length)]
}

export async function GET(request: NextRequest) {
  try {
    // Resolve userId via multiple auth methods
    const cookieStore = await cookies()
    let userId = ''

    // 1. Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const { validateToken } = await import('@/lib/auth/utils')
      const t = await validateToken(authHeader.replace('Bearer ', '').trim())
      if (t.valid && t.userId) userId = t.userId
    }

    // 2. Cookie 'token' (set oleh AuthContext)
    if (!userId) {
      const tokenCookie = cookieStore.get('token')
      if (tokenCookie?.value) {
        const { validateToken } = await import('@/lib/auth/utils')
        const t = await validateToken(tokenCookie.value)
        if (t.valid && t.userId) userId = t.userId
      }
    }

    // 3. Cookie 'user' legacy
    if (!userId) {
      const userCookie = cookieStore.get('user')
      if (!userCookie) {
        return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
      }
      try {
        const user = JSON.parse(userCookie.value)
        if (!user.id || user.id === 'anonymous') {
          return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
        }
        userId = user.id
      } catch {
        return NextResponse.json({ error: { message: 'Invalid token' } }, { status: 401 })
      }
    }

    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    // ⚡ OPTIMASI: Pakai index practice_sessions(student_user_id, status)
    const activeSessions = await db.select()
      .from(practiceSessions)
      .where(and(
        eq(practiceSessions.studentUserId, userId),
        eq(practiceSessions.status, 'ACTIVE')
      ))
      .orderBy(desc(practiceSessions.startedAt))
      .limit(1)

    if (activeSessions.length === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'No active session' } }, { status: 404 })
    }

    const session = activeSessions[0]

    // ⚡ OPTIMASI: Fetch material (PK lookup = 1 row)
    const [material] = await db.select().from(materials)
      .where(eq(materials.id, session.materialId))
      .limit(1)

    // ⚡ OPTIMASI: Batasi sessionAttempts dengan LIMIT
    // Cukup untuk stats dan rotasi soal — tidak perlu semua attempt historis
    const sessionAttempts = await db.select()
      .from(practiceAttempts)
      .where(eq(practiceAttempts.sessionId, session.id))
      .orderBy(desc(practiceAttempts.createdAt))
      .limit(200) // Cukup untuk 200 soal — lebih dari cukup per sesi

    let currentQuestion = null

    // Coba resume dengan currentQuestionId yang sudah disimpan
    if (session.currentQuestionId) {
      const [q] = await db.select().from(questions)
        .where(eq(questions.id, session.currentQuestionId))
        .limit(1)
      if (q) currentQuestion = q
    }

    // Jika tidak ada currentQuestionId, pick soal baru
    if (!currentQuestion) {
      const usedIds = new Set(sessionAttempts.map(a => a.questionId))
      currentQuestion = await pickQuestion(session.materialId, session.currentDifficulty || 2, usedIds)

      if (currentQuestion) {
        // Update session dengan soal baru (best-effort, tidak blocking)
        db.update(practiceSessions)
          .set({ currentQuestionId: currentQuestion.id })
          .where(eq(practiceSessions.id, session.id))
          .catch(err => console.error('Update currentQuestionId error:', err))
      }
    }

    if (!currentQuestion) {
      return NextResponse.json({ error: { message: 'No questions available' } }, { status: 404 })
    }

    // Stats
    const correctAnswers = sessionAttempts.filter(a => a.isCorrect).length
    const totalAttempts = sessionAttempts.length

    return NextResponse.json({
      sessionId: session.id,
      materialId: session.materialId,
      materialName: material?.title || 'Matematika',
      floor: session.floor,
      consecutiveWrong: session.consecutiveWrong,
      currentDifficulty: session.currentDifficulty,
      difficultyLabel: DIFFICULTY_LABELS[session.currentDifficulty] || 'Sedang',
      currentStreak: session.currentStreak || 0,
      mode: 'practice',
      question: formatQuestionForClient(currentQuestion),
      stats: { floorsClimbed: session.floor - 1, correctAnswers, totalAttempts }
    })
  } catch (error) {
    console.error('Fetch current session error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
