import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { hashPassword, createAuthToken } from '@/lib/auth/utils'

// Siswa mendaftar sendiri dengan NISN + nama + password
export async function POST(request: NextRequest) {
  try {
    const { nisn, name, password } = await request.json()

    // Validation
    if (!nisn || !name || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'NISN, nama, dan password diperlukan' } },
        { status: 400 }
      )
    }

    // Validate NISN format (hanya angka, minimal 1 digit)
    if (!/^\d+$/.test(nisn)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'NISN harus berupa angka' } },
        { status: 400 }
      )
    }

    if (name.trim().length < 3) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Nama minimal 3 karakter' } },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Password minimal 6 karakter' } },
        { status: 400 }
      )
    }

    // Check if NISN already exists
    const [existingStudent] = await db
      .select()
      .from(users)
      .where(and(eq(users.nisn, nisn), eq(users.role, 'STUDENT')))
      .limit(1)

    if (existingStudent) {
      return NextResponse.json(
        { error: { code: 'AUTH_NISN_EXISTS', message: 'NISN sudah terdaftar. Silakan login.' } },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new student
    const newId = `ST${Date.now().toString(36).toUpperCase()}`
    const newStudent = {
      id: newId,
      role: 'STUDENT' as const,
      nisn,
      name: name.trim(),
      password: hashedPassword,
      passwordStatus: 'SET' as const,
      createdAt: new Date().toISOString(),
    }

    await db.insert(users).values(newStudent)

    // Create auth token
    const token = await createAuthToken(newId, 'STUDENT')

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newStudent.id,
        role: newStudent.role,
        name: newStudent.name,
        nisn: newStudent.nisn,
        passwordStatus: newStudent.passwordStatus,
        createdAt: newStudent.createdAt,
      },
    })
  } catch (error) {
    console.error('Student register error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
