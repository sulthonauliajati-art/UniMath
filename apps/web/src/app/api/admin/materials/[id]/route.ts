import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

async function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null

  const tokenData = await validateToken(token)
  if (!tokenData.valid || tokenData.role !== 'ADMIN') return null
  return tokenData
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id } = await params
    const { title, description, grade, videoUrl, summaryUrl, fullUrl } = await request.json()

    await db
      .update(materials)
      .set({
        title,
        description: description || null,
        grade: grade || '4',
        videoUrl: videoUrl || null,
        summaryUrl: summaryUrl || null,
        fullUrl: fullUrl || null,
      })
      .where(eq(materials.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update material error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { id } = await params
    await db.delete(materials).where(eq(materials.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete material error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
