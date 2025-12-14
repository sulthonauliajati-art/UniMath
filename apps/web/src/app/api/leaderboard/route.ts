import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, practiceSessions, attempts, classStudents } from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const limit = parseInt(searchParams.get('limit') || '10')

    let studentIds: string[] = []

    if (classId) {
      // Get students in specific class
      const classStudentRecords = await db
        .select({ studentUserId: classStudents.studentUserId })
        .from(classStudents)
        .where(eq(classStudents.classId, classId))
      studentIds = classStudentRecords.map((cs) => cs.studentUserId)
    }

    // Get all students with their stats
    const studentsQuery = classId && studentIds.length > 0
      ? db.select().from(users).where(inArray(users.id, studentIds))
      : db.select().from(users).where(eq(users.role, 'STUDENT'))

    const allStudents = await studentsQuery

    // Calculate stats for each student
    const leaderboard = await Promise.all(
      allStudents.map(async (student) => {
        const [sessionStats] = await db
          .select({
            totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
            totalSessions: sql<number>`count(*)`,
          })
          .from(practiceSessions)
          .where(eq(practiceSessions.studentUserId, student.id))

        const [attemptStats] = await db
          .select({
            totalAttempts: sql<number>`count(*)`,
            correctAttempts: sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`,
          })
          .from(attempts)
          .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
          .where(eq(practiceSessions.studentUserId, student.id))

        const totalAttempts = attemptStats?.totalAttempts || 0
        const correctAttempts = attemptStats?.correctAttempts || 0
        const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

        return {
          id: student.id,
          name: student.name,
          totalFloors: sessionStats?.totalFloors || 0,
          totalSessions: sessionStats?.totalSessions || 0,
          accuracy,
          points: student.totalPoints || 0,
        }
      })
    )

    // Sort by total floors (descending)
    leaderboard.sort((a, b) => b.totalFloors - a.totalFloors)

    // Add rank
    const rankedLeaderboard = leaderboard.slice(0, limit).map((student, index) => ({
      ...student,
      rank: index + 1,
    }))

    return NextResponse.json({ leaderboard: rankedLeaderboard })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
