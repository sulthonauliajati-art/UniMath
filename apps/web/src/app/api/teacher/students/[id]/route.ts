import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, practiceSessions, attempts, materials } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token diperlukan' } },
        { status: 401 }
      )
    }

    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'TEACHER') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token tidak valid' } },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get student
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get stats
    const [sessionStats] = await db
      .select({
        totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
        totalSessions: sql<number>`count(*)`,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.studentUserId, id))

    const [attemptStats] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        correctAttempts: sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`,
      })
      .from(attempts)
      .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
      .where(eq(practiceSessions.studentUserId, id))

    const totalAttempts = attemptStats?.totalAttempts || 0
    const correctAttempts = attemptStats?.correctAttempts || 0
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    // Get progress per material
    const allMaterials = await db.select().from(materials)
    
    const materialProgress = await Promise.all(
      allMaterials.map(async (mat) => {
        const [matStats] = await db
          .select({
            totalAttempts: sql<number>`count(*)`,
            correctAttempts: sql<number>`sum(case when ${attempts.isCorrect} = 1 then 1 else 0 end)`,
          })
          .from(attempts)
          .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
          .where(
            sql`${practiceSessions.studentUserId} = ${id} AND ${practiceSessions.materialId} = ${mat.id}`
          )

        const total = matStats?.totalAttempts || 0
        const correct = matStats?.correctAttempts || 0
        const progress = total > 0 ? Math.round((correct / total) * 100) : 0

        return {
          materialId: mat.id,
          materialName: mat.title,
          progress,
        }
      })
    )

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        nisn: student.nisn,
        passwordStatus: student.passwordStatus,
        stats: {
          totalFloors: sessionStats?.totalFloors || 0,
          totalSessions: sessionStats?.totalSessions || 0,
          accuracy,
        },
        materialProgress: materialProgress.filter((m) => m.progress > 0),
      },
    })
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
