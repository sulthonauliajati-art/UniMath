import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { schools, teacherSchools } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
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
      .select()
      .from(schools)
      .where(eq(schools.ownerTeacherId, teacherId))

    // Get schools teacher is associated with
    const associatedSchoolIds = await db
      .select({ schoolId: teacherSchools.schoolId })
      .from(teacherSchools)
      .where(eq(teacherSchools.teacherId, teacherId))

    let associatedSchools: typeof ownedSchools = []
    if (associatedSchoolIds.length > 0) {
      const ids = associatedSchoolIds.map((s) => s.schoolId)
      associatedSchools = await db
        .select()
        .from(schools)
        .where(inArray(schools.id, ids))
    }

    // Combine and mark ownership
    const allSchools = [
      ...ownedSchools.map((s) => ({ ...s, isOwner: true })),
      ...associatedSchools
        .filter((s) => !ownedSchools.find((o) => o.id === s.id))
        .map((s) => ({ ...s, isOwner: false })),
    ]

    return NextResponse.json({ schools: allSchools })
  } catch (error) {
    console.error('Get schools error:', error)
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

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Nama sekolah diperlukan' } },
        { status: 400 }
      )
    }

    const teacherId = tokenData.userId
    const newSchoolId = `S${Date.now().toString(36).toUpperCase()}`
    
    const newSchool = {
      id: newSchoolId,
      name: name.trim(),
      ownerTeacherId: teacherId,
      createdAt: new Date().toISOString(),
    }

    await db.insert(schools).values(newSchool)

    // Also add to teacher_schools for consistency
    await db.insert(teacherSchools).values({
      teacherId,
      schoolId: newSchoolId,
    })

    return NextResponse.json({ school: { ...newSchool, isOwner: true } })
  } catch (error) {
    console.error('Create school error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
