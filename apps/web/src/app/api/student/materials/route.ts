import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { materials, practiceSessions, questions } from '@/lib/db/schema'
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
        userId = user.id
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
          // Get total questions for this material
          const [questionCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(questions)
            .where(eq(questions.materialId, material.id))

          // Get completed sessions (floors climbed) for this material
          const [sessionStats] = await db
            .select({ 
              totalFloors: sql<number>`COALESCE(SUM(floor), 0)`,
              completedSessions: sql<number>`COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)`
            })
            .from(practiceSessions)
            .where(
              and(
                eq(practiceSessions.studentUserId, userId),
                eq(practiceSessions.materialId, material.id)
              )
            )

          // Calculate progress based on floors climbed vs total questions
          const totalQuestions = questionCount?.count || 0
          const floorsClimbed = sessionStats?.totalFloors || 0
          
          if (totalQuestions > 0) {
            // Progress = (floors climbed / total questions) * 100, max 100%
            progress = Math.min(Math.round((floorsClimbed / totalQuestions) * 100), 100)
          }
        }

        return {
          id: material.id,
          title: material.title,
          description: material.description,
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
