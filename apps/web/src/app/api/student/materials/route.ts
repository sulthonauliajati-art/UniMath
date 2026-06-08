import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { materials, practiceSessions, practiceAttempts, questions } from '@/lib/db/schema'
import { eq, sql, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Get user from cookie for progress calculation
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')
    let userId: string | null = null

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        if (user.id && user.id !== 'anonymous') {
          userId = user.id
        }
      } catch {}
    }

    // Get all active materials
    const allMaterials = await db
      .select()
      .from(materials)
      .where(eq(materials.isActive, true))
      .orderBy(materials.order)

    // Calculate progress for each material
    const materialsWithProgress = await Promise.all(
      allMaterials.map(async (material) => {
        let progress = 0

        if (userId) {
          // ✅ FIX #7: Hitung progress berdasarkan jawaban BENAR, bukan SUM(floor)
          // Total soal PRACTICE untuk materi ini
          const [questionCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(questions)
            .where(
              and(
                eq(questions.materialId, material.id),
                // hanya hitung soal practice
                sql`(${questions.mode} = 'PRACTICE' OR ${questions.mode} = 'ALL')`
              )
            )

          const totalPracticeQuestions = questionCount?.count || 0

          if (totalPracticeQuestions > 0) {
            // Hitung total jawaban benar dari semua attempt untuk materi ini
            const [correctStats] = await db
              .select({
                correctCount: sql<number>`COALESCE(SUM(CASE WHEN ${practiceAttempts.isCorrect} = 1 THEN 1 ELSE 0 END), 0)`,
              })
              .from(practiceAttempts)
              .innerJoin(practiceSessions, eq(practiceAttempts.sessionId, practiceSessions.id))
              .where(
                and(
                  eq(practiceSessions.studentUserId, userId),
                  eq(practiceSessions.materialId, material.id)
                )
              )

            const correctAnswers = correctStats?.correctCount || 0
            // Progress = jawaban benar / total soal practice, max 100%
            // Minimal 10 soal benar dianggap 100%
            const targetAnswers = Math.min(totalPracticeQuestions, 10)
            progress = Math.min(Math.round((correctAnswers / targetAnswers) * 100), 100)
          }
        }

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
    )

    return NextResponse.json({ materials: materialsWithProgress })
  } catch (error) {
    console.error('Get materials error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
