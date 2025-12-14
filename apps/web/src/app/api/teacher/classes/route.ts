import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { classes, classStudents, schools, teacherSchools } from '@/lib/db/schema'
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
      return NextResponse.json({ classes: [] })
    }

    // Get classes in these schools
    const teacherClasses = await db
      .select()
      .from(classes)
      .where(inArray(classes.schoolId, uniqueSchoolIds))

    // Get student count for each class
    const classesWithCount = await Promise.all(
      teacherClasses.map(async (cls) => {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(classStudents)
          .where(eq(classStudents.classId, cls.id))

        return {
          ...cls,
          studentCount: countResult?.count || 0,
        }
      })
    )

    return NextResponse.json({ classes: classesWithCount })
  } catch (error) {
    console.error('Get classes error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { name, grade, schoolId } = await request.json()

    if (!name || !grade) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Nama dan tingkat diperlukan' } },
        { status: 400 }
      )
    }

    // Verify teacher owns or is associated with this school
    const teacherId = tokenData.userId

    // Check if school exists and teacher has access
    if (schoolId) {
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, schoolId))
        .limit(1)

      if (!school) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Sekolah tidak ditemukan' } },
          { status: 404 }
        )
      }

      // Check if teacher owns or is associated with this school
      const isOwner = school.ownerTeacherId === teacherId
      const [isAssociated] = await db
        .select()
        .from(teacherSchools)
        .where(
          sql`${teacherSchools.teacherId} = ${teacherId} AND ${teacherSchools.schoolId} = ${schoolId}`
        )
        .limit(1)

      if (!isOwner && !isAssociated) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses ke sekolah ini' } },
          { status: 403 }
        )
      }
    }

    const newClassId = `C${Date.now().toString(36).toUpperCase()}`
    const newClass = {
      id: newClassId,
      schoolId: schoolId || 'S001',
      name,
      grade,
      createdAt: new Date().toISOString(),
    }

    await db.insert(classes).values(newClass)

    return NextResponse.json({ class: newClass })
  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
