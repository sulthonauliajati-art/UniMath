import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { practiceSessions, attempts, classStudents, classes, schools, teacherProfiles } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

// Helper function to award points to teacher
async function awardTeacherPoints(studentUserId: string, pointsToAdd: number) {
  try {
    // Find teacher through: student -> classStudents -> classes -> schools -> ownerTeacherId
    const teacherResult = await db
      .select({ teacherId: schools.ownerTeacherId })
      .from(classStudents)
      .innerJoin(classes, eq(classes.id, classStudents.classId))
      .innerJoin(schools, eq(schools.id, classes.schoolId))
      .where(eq(classStudents.studentUserId, studentUserId))
      .limit(1)

    if (teacherResult.length > 0) {
      const teacherId = teacherResult[0].teacherId
      
      // Update teacher points
      await db
        .update(teacherProfiles)
        .set({
          points: sql`${teacherProfiles.points} + ${pointsToAdd}`,
        })
        .where(eq(teacherProfiles.userId, teacherId))
    }
  } catch (error) {
    console.error('Failed to award teacher points:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Session ID diperlukan' } },
        { status: 400 }
      )
    }

    // Get session
    const [session] = await db
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.id, sessionId))
      .limit(1)

    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get stats from attempts
    const [attemptStats] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        correctAnswers: sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`,
      })
      .from(attempts)
      .where(eq(attempts.sessionId, sessionId))

    // Update session status
    await db
      .update(practiceSessions)
      .set({
        status: reason === 'completed' ? 'COMPLETED' : 'ABANDONED',
        endedAt: new Date().toISOString(),
      })
      .where(eq(practiceSessions.id, sessionId))

    // Award points to teacher if session completed
    if (reason === 'completed') {
      let teacherPoints = 1 // Base point for completing practice

      // Bonus points for good accuracy (>= 80%)
      const totalAttempts = attemptStats?.totalAttempts || 0
      const correctAnswers = attemptStats?.correctAnswers || 0
      if (totalAttempts > 0) {
        const accuracy = (correctAnswers / totalAttempts) * 100
        if (accuracy >= 80) {
          teacherPoints += 2 // Bonus for good performance
        }
      }

      await awardTeacherPoints(session.studentUserId, teacherPoints)
    }

    return NextResponse.json({
      success: true,
      stats: {
        floorsClimbed: session.floor - 1,
        correctAnswers: attemptStats?.correctAnswers || 0,
        totalAttempts: attemptStats?.totalAttempts || 0,
      },
    })
  } catch (error) {
    console.error('End practice error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
