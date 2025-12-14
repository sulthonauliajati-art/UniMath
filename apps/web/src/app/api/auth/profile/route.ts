import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const tokenData = await validateToken(token)
    if (!tokenData.valid || !tokenData.userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: { message: 'Nama minimal 2 karakter' } },
        { status: 400 }
      )
    }

    await db.update(users).set({ name: name.trim() }).where(eq(users.id, tokenData.userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
