import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// One-time setup endpoint to create admin
// DELETE THIS FILE AFTER CREATING ADMIN!
export async function POST(request: NextRequest) {
  try {
    const { secretKey } = await request.json()

    // Simple protection - change this key
    if (secretKey !== 'setup-unimath-2024') {
      return NextResponse.json({ error: 'Invalid key' }, { status: 403 })
    }

    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'ADMIN'))
      .limit(1)

    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 })
    }

    const email = 'admin@unimath.com'
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 10)

    await db.insert(users).values({
      id: 'ADMIN001',
      role: 'ADMIN',
      name: 'Super Admin',
      email,
      password: hashedPassword,
      passwordStatus: 'SET',
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Admin created!',
      credentials: { email, password },
    })
  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
