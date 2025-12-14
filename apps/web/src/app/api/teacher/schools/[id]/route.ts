import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { schools } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

// P1 Fix: Update school name
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'TEACHER') {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id } = await params
    const teacherId = tokenData.userId!
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: { message: 'Nama sekolah wajib diisi' } }, { status: 400 })
    }

    // Check if teacher owns this school
    const [school] = await db
      .select()
      .from(schools)
      .where(and(eq(schools.id, id), eq(schools.ownerTeacherId, teacherId)))

    if (!school) {
      return NextResponse.json({ error: { message: 'Sekolah tidak ditemukan atau Anda bukan pemilik' } }, { status: 404 })
    }

    // Update school name
    await db
      .update(schools)
      .set({ name: name.trim() })
      .where(eq(schools.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update school error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
