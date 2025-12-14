import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { schools, classes, classStudents, teacherProfiles, teacherSchools } from '@/lib/db/schema'
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

    // Get teacher profile
    const [profile] = await db
      .select()
      .from(teacherProfiles)
      .where(eq(teacherProfiles.userId, teacherId))
      .limit(1)

    // Get schools owned by this teacher
    const ownedSchools = await db
      .select()
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

    // Get classes in these schools
    let totalClasses = 0
    let totalStudents = 0
    let classIds: string[] = []

    if (uniqueSchoolIds.length > 0) {
      const teacherClasses = await db
        .select()
        .from(classes)
        .where(inArray(classes.schoolId, uniqueSchoolIds))

      totalClasses = teacherClasses.length
      classIds = teacherClasses.map((c) => c.id)

      // Get total students in these classes
      if (classIds.length > 0) {
        const [studentCount] = await db
          .select({ count: sql<number>`count(DISTINCT student_user_id)` })
          .from(classStudents)
          .where(inArray(classStudents.classId, classIds))

        totalStudents = studentCount?.count || 0
      }
    }

    return NextResponse.json({
      stats: {
        totalStudents,
        totalClasses,
        totalSchools: uniqueSchoolIds.length,
        points: profile?.points || 0,
      },
    })
  } catch (error) {
    console.error('Get teacher stats error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
