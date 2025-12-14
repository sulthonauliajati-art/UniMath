import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, teacherProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { hashPassword, createAuthToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Nama, email, dan password diperlukan' } },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Password minimal 6 karakter' } },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Format email tidak valid' } },
        { status: 400 }
      )
    }

    // Check if email already exists
    const [existingTeacher] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), eq(users.role, 'TEACHER')))
      .limit(1)

    if (existingTeacher) {
      return NextResponse.json(
        { error: { code: 'AUTH_EMAIL_EXISTS', message: 'Email sudah terdaftar' } },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new teacher
    const newId = `T${Date.now().toString(36).toUpperCase()}`
    const newTeacher = {
      id: newId,
      role: 'TEACHER' as const,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      passwordStatus: 'SET' as const,
      createdAt: new Date().toISOString(),
    }

    await db.insert(users).values(newTeacher)
    await db.insert(teacherProfiles).values({
      userId: newId,
      displayName: name.trim(),
      points: 0,
    })

    // Create auth token
    const token = await createAuthToken(newId, 'TEACHER')

    return NextResponse.json({
      token,
      user: {
        id: newTeacher.id,
        role: newTeacher.role,
        name: newTeacher.name,
        email: newTeacher.email,
        passwordStatus: newTeacher.passwordStatus,
        createdAt: newTeacher.createdAt,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
