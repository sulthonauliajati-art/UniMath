import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import {
  users,
  classes,
  classStudents,
  practiceSessions,
  attempts,
  schools,
  teacherSchools,
} from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'TEACHER') {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const teacherId = tokenData.userId!
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const format = searchParams.get('format') || 'csv'

    // Get teacher's schools
    const ownedSchools = await db
      .select({ id: schools.id })
      .from(schools)
      .where(eq(schools.ownerTeacherId, teacherId))

    const associatedSchools = await db
      .select({ schoolId: teacherSchools.schoolId })
      .from(teacherSchools)
      .where(eq(teacherSchools.teacherId, teacherId))

    const allSchoolIds = [
      ...ownedSchools.map((s) => s.id),
      ...associatedSchools.map((s) => s.schoolId),
    ]

    if (allSchoolIds.length === 0) {
      return NextResponse.json({ error: { message: 'No schools found' } }, { status: 404 })
    }

    // Get classes
    let teacherClasses = await db
      .select()
      .from(classes)
      .where(inArray(classes.schoolId, allSchoolIds))

    if (classId) {
      teacherClasses = teacherClasses.filter((c) => c.id === classId)
    }

    // Build report data
    const reportData: string[][] = [
      ['Kelas', 'Nama Siswa', 'NISN', 'Total Lantai', 'Total Sesi', 'Akurasi (%)', 'Status'],
    ]

    for (const cls of teacherClasses) {
      const classStudentRecords = await db
        .select({ studentUserId: classStudents.studentUserId })
        .from(classStudents)
        .where(eq(classStudents.classId, cls.id))

      const studentIds = classStudentRecords.map((cs) => cs.studentUserId)

      if (studentIds.length === 0) continue

      const studentRecords = await db
        .select()
        .from(users)
        .where(inArray(users.id, studentIds))

      for (const student of studentRecords) {
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

        reportData.push([
          cls.name,
          student.name,
          student.nisn || '-',
          String(sessionStats?.totalFloors || 0),
          String(sessionStats?.totalSessions || 0),
          String(accuracy),
          student.passwordStatus === 'SET' ? 'Aktif' : 'Belum Aktif',
        ])
      }
    }

    if (format === 'csv') {
      const csv = reportData.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="laporan_siswa_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ data: reportData })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
