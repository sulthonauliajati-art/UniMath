import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { classes, classStudents, users, practiceSessions, attempts } from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [cls] = await db.select().from(classes).where(eq(classes.id, id)).limit(1)

    if (!cls) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get student IDs in this class
    const classStudentRecords = await db
      .select({ studentUserId: classStudents.studentUserId })
      .from(classStudents)
      .where(eq(classStudents.classId, id))

    const studentIds = classStudentRecords.map((cs) => cs.studentUserId)

    if (studentIds.length === 0) {
      return NextResponse.json({ class: cls, students: [] })
    }

    // Get students
    const studentRecords = await db
      .select()
      .from(users)
      .where(inArray(users.id, studentIds))

    // Get stats for each student
    const students = await Promise.all(
      studentRecords.map(async (s) => {
        // Get session stats
        const [sessionStats] = await db
          .select({
            totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
            totalSessions: sql<number>`count(*)`,
          })
          .from(practiceSessions)
          .where(eq(practiceSessions.studentUserId, s.id))

        // Get accuracy
        const [attemptStats] = await db
          .select({
            totalAttempts: sql<number>`count(*)`,
            correctAttempts: sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`,
          })
          .from(attempts)
          .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
          .where(eq(practiceSessions.studentUserId, s.id))

        const totalAttempts = attemptStats?.totalAttempts || 0
        const correctAttempts = attemptStats?.correctAttempts || 0
        const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

        return {
          id: s.id,
          name: s.name,
          nisn: s.nisn,
          passwordStatus: s.passwordStatus,
          stats: {
            totalFloors: sessionStats?.totalFloors || 0,
            totalSessions: sessionStats?.totalSessions || 0,
            accuracy,
          },
        }
      })
    )

    return NextResponse.json({ class: cls, students })
  } catch (error) {
    console.error('Get class error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
