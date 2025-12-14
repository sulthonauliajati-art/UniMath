import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET: Cari siswa berdasarkan NISN (untuk guru)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nisn = searchParams.get('nisn')

    if (!nisn) {
      return NextResponse.json(
        { exists: false, student: null },
        { status: 200 }
      )
    }

    const [student] = await db
      .select({
        id: users.id,
        name: users.name,
        nisn: users.nisn,
      })
      .from(users)
      .where(and(eq(users.nisn, nisn), eq(users.role, 'STUDENT')))
      .limit(1)

    if (!student) {
      return NextResponse.json({ exists: false, student: null })
    }

    return NextResponse.json({ exists: true, student })
  } catch (error) {
    console.error('Search NISN error:', error)
    return NextResponse.json(
      { exists: false, student: null, error: 'Server error' },
      { status: 500 }
    )
  }
}

// POST: Check NISN untuk menentukan apakah siswa perlu set password atau login
export async function POST(request: NextRequest) {
  try {
    const { nisn } = await request.json()

    if (!nisn) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'NISN diperlukan' } },
        { status: 400 }
      )
    }

    const [student] = await db
      .select({
        id: users.id,
        name: users.name,
        nisn: users.nisn,
        passwordStatus: users.passwordStatus,
      })
      .from(users)
      .where(and(eq(users.nisn, nisn), eq(users.role, 'STUDENT')))
      .limit(1)

    if (!student) {
      return NextResponse.json(
        { error: { code: 'AUTH_USER_NOT_FOUND', message: 'NISN tidak ditemukan. Hubungi guru untuk didaftarkan.' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      found: true,
      name: student.name,
      passwordStatus: student.passwordStatus,
      needSetPassword: student.passwordStatus === 'UNSET',
    })
  } catch (error) {
    console.error('Check NISN error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
