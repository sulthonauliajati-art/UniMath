import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { materials, practiceSessions, practiceAttempts, questions } from '@/lib/db/schema'
import { eq, sql, and, or } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Get user from multiple auth sources
    const cookieStore = await cookies()
    let userId: string | null = null

    // 1. Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const { validateToken } = await import('@/lib/auth/utils')
      const t = await validateToken(authHeader.replace('Bearer ', '').trim())
      if (t.valid && t.userId) userId = t.userId
    }

    // 2. Cookie 'token'
    if (!userId) {
      const tokenCookie = cookieStore.get('token')
      if (tokenCookie?.value) {
        const { validateToken } = await import('@/lib/auth/utils')
        const t = await validateToken(tokenCookie.value)
        if (t.valid && t.userId) userId = t.userId
      }
    }

    // 3. Legacy cookie 'user'
    if (!userId) {
      const userCookie = cookieStore.get('user')
      if (userCookie) {
        try {
          const user = JSON.parse(userCookie.value)
          if (user.id && user.id !== 'anonymous') userId = user.id
        } catch {}
      }
    }

    // ⚡ OPTIMASI: 1 query untuk semua materi
    const allMaterials = await db
      .select()
      .from(materials)
      .where(eq(materials.isActive, true))
      .orderBy(materials.order)

    if (allMaterials.length === 0) {
      return NextResponse.json({ materials: [] })
    }

    // Jika tidak ada user yang login, kembalikan progress 0 untuk semua
    if (!userId) {
      return NextResponse.json({
        materials: allMaterials.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          shortDescription: m.shortDescription,
          grade: m.grade,
          order: m.order,
          thumbnailUrl: m.thumbnailUrl,
          progress: 0,
        }))
      })
    }

    // ⚡ OPTIMASI UTAMA: Ganti N+1 pattern → 2 query batch untuk SEMUA materi sekaligus
    //
    // Sebelum (N+1): untuk 6 materi = 12 queries + full table scan tiap JOINs
    // Sesudah (batch): 2 queries total dengan GROUP BY, pakai index

    // Query 1 batch: Hitung soal PRACTICE per materi (semua materi sekaligus)
    const questionCountsByMaterial = await db
      .select({
        materialId: questions.materialId,
        count: sql<number>`COUNT(*)`,
      })
      .from(questions)
      .where(or(eq(questions.mode, 'PRACTICE'), eq(questions.mode, 'ALL')))
      .groupBy(questions.materialId)

    const qCountMap = new Map<string, number>()
    questionCountsByMaterial.forEach(row => qCountMap.set(row.materialId, row.count))

    // Query 2 batch: Hitung jawaban benar per materi untuk user ini (semua materi sekaligus)
    const correctByMaterial = await db
      .select({
        materialId: practiceSessions.materialId,
        correctCount: sql<number>`COALESCE(SUM(CASE WHEN ${practiceAttempts.isCorrect} = 1 THEN 1 ELSE 0 END), 0)`,
      })
      .from(practiceAttempts)
      .innerJoin(practiceSessions, eq(practiceAttempts.sessionId, practiceSessions.id))
      .where(eq(practiceSessions.studentUserId, userId))
      .groupBy(practiceSessions.materialId)

    const correctMap = new Map<string, number>()
    correctByMaterial.forEach(row => correctMap.set(row.materialId, row.correctCount))

    // Hitung progress dari in-memory maps — zero additional DB calls
    const materialsWithProgress = allMaterials.map(material => {
      const totalPracticeQ = qCountMap.get(material.id) || 0
      const correctAnswers = correctMap.get(material.id) || 0
      const targetAnswers = Math.min(totalPracticeQ, 10)
      const progress = totalPracticeQ > 0 && targetAnswers > 0
        ? Math.min(Math.round((correctAnswers / targetAnswers) * 100), 100)
        : 0

      return {
        id: material.id,
        title: material.title,
        description: material.description,
        shortDescription: material.shortDescription,
        grade: material.grade,
        order: material.order,
        thumbnailUrl: material.thumbnailUrl,
        progress,
      }
    })

    return NextResponse.json({ materials: materialsWithProgress })
  } catch (error) {
    console.error('Get materials error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
