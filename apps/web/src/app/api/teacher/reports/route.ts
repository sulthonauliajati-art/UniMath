import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { schools, classes, classStudents, users, practiceSessions, attempts, teacherSchools } from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token diperlukan' } },
        { status: 401 }
      )
    }

    // Validate token
    const tokenData = await validateToken(token)
    if (!tokenData.valid || !tokenData.userId || tokenData.role !== 'TEACHER') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token tidak valid' } },
        { status: 401 }
      )
    }

    const teacherId = tokenData.userId

    // Get schools owned by this teacher
    const ownedSchools = await db
      .select({ id: schools.id })
      .from(schools)
      .where(eq(schools.ownerTeacherId, teacherId))

    // Get schools teacher is associated with
    const associatedSchools = await db
      .select({ schoolId: teacherSchools.schoolId })
      .from(teacherSchools)
      .where(eq(teacherSchools.teacherId, teacherId))

    const allSchoolIds = [
      ...ownedSchools.map((s) => s.id),
      ...associatedSchools.map((s) => s.schoolId),
    ]
    const uniqueSchoolIds = Array.from(new Set(allSchoolIds))

    if (uniqueSchoolIds.length === 0) {
      return NextResponse.json({
        summary: { totalFloors: 0, avgAccuracy: 0, totalSessions: 0 },
        topStudents: [],
      })
    }

    // Get classes in these schools
    const teacherClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(inArray(classes.schoolId, uniqueSchoolIds))

    const classIds = teacherClasses.map((c) => c.id)

    if (classIds.length === 0) {
      return NextResponse.json({
        summary: { totalFloors: 0, avgAccuracy: 0, totalSessions: 0 },
        topStudents: [],
      })
    }

    // Get student IDs in these classes
    const studentRecords = await db
      .select({ studentUserId: classStudents.studentUserId })
      .from(classStudents)
      .where(inArray(classStudents.classId, classIds))

    const studentIds = Array.from(new Set(studentRecords.map((s) => s.studentUserId)))

    if (studentIds.length === 0) {
      return NextResponse.json({
        summary: { totalFloors: 0, avgAccuracy: 0, totalSessions: 0 },
        topStudents: [],
      })
    }

    // Get summary stats for all students
    const [summaryStats] = await db
      .select({
        totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
        totalSessions: sql<number>`count(*)`,
      })
      .from(practiceSessions)
      .where(inArray(practiceSessions.studentUserId, studentIds))

    // Get accuracy
    const [accuracyStats] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        correctAttempts: sql<number>`COALESCE(sum(case when is_correct = 1 then 1 else 0 end), 0)`,
      })
      .from(attempts)
      .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
      .where(inArray(practiceSessions.studentUserId, studentIds))

    const totalAttempts = accuracyStats?.totalAttempts || 0
    const correctAttempts = accuracyStats?.correctAttempts || 0
    const avgAccuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    // Get top students
    const topStudentsData = await Promise.all(
      studentIds.map(async (studentId) => {
        const [student] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, studentId))
          .limit(1)

        const [stats] = await db
          .select({
            totalFloors: sql<number>`COALESCE(SUM(floor - 1), 0)`,
          })
          .from(practiceSessions)
          .where(eq(practiceSessions.studentUserId, studentId))

        const [accStats] = await db
          .select({
            totalAttempts: sql<number>`count(*)`,
            correctAttempts: sql<number>`COALESCE(sum(case when is_correct = 1 then 1 else 0 end), 0)`,
          })
          .from(attempts)
          .innerJoin(practiceSessions, eq(attempts.sessionId, practiceSessions.id))
          .where(eq(practiceSessions.studentUserId, studentId))

        const studentAccuracy =
          accStats?.totalAttempts > 0
            ? Math.round((accStats.correctAttempts / accStats.totalAttempts) * 100)
            : 0

        return {
          name: student?.name || 'Unknown',
          floors: stats?.totalFloors || 0,
          accuracy: studentAccuracy,
        }
      })
    )

    // Sort by floors and take top 10
    const topStudents = topStudentsData
      .sort((a, b) => b.floors - a.floors)
      .slice(0, 10)

    return NextResponse.json({
      summary: {
        totalFloors: summaryStats?.totalFloors || 0,
        avgAccuracy,
        totalSessions: summaryStats?.totalSessions || 0,
      },
      topStudents,
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
