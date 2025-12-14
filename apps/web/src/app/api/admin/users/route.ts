import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, teacherProfiles, classStudents, classes, schools } from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Token diperlukan' } }, { status: 401 })
    }

    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Akses ditolak' } }, { status: 401 })
    }

    // Get all teachers
    const teachers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        points: teacherProfiles.points,
      })
      .from(users)
      .leftJoin(teacherProfiles, eq(teacherProfiles.userId, users.id))
      .where(eq(users.role, 'TEACHER'))

    // Get all students
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        nisn: users.nisn,
        totalPoints: users.totalPoints,
        passwordStatus: users.passwordStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, 'STUDENT'))

    return NextResponse.json({ teachers, students })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } }, { status: 500 })
  }
}
