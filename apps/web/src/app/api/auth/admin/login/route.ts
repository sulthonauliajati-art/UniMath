import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, authTokens } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email dan password diperlukan' } },
        { status: 400 }
      )
    }

    // Find admin by email
    const [admin] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.role, 'ADMIN')))
      .limit(1)

    if (!admin) {
      return NextResponse.json(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Email atau password salah' } },
        { status: 401 }
      )
    }

    // Check password
    if (!admin.password) {
      return NextResponse.json(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Email atau password salah' } },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, admin.password)
    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Email atau password salah' } },
        { status: 401 }
      )
    }

    // Generate token
    const token = `ADM${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await db.insert(authTokens).values({
      token,
      userId: admin.id,
      role: 'ADMIN',
      expiresAt,
    })

    return NextResponse.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'ADMIN',
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
