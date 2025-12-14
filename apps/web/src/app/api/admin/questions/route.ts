import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions } from '@/lib/db/schema'
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

export async function GET(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json({ questions: [] })
    }

    const allQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.materialId, materialId))
      .orderBy(questions.difficulty)

    return NextResponse.json({ questions: allQuestions })
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json({ error: { message: 'Material ID diperlukan' } }, { status: 400 })
    }

    await db.delete(questions).where(eq(questions.materialId, materialId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete questions error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
