import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, practiceAttempts, testAttempts } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
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

    // Ambil ID soal yang akan dihapus dulu
    const targetQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.materialId, materialId))

    if (targetQuestions.length > 0) {
      const questionIds = targetQuestions.map((q) => q.id)

      // Hapus practiceAttempts yang mereferensi soal ini (FK constraint)
      await db
        .delete(practiceAttempts)
        .where(inArray(practiceAttempts.questionId, questionIds))

      // Hapus testAttempts yang mereferensi soal ini (FK constraint)
      await db
        .delete(testAttempts)
        .where(inArray(testAttempts.questionId, questionIds))

      // Baru hapus soalnya
      await db.delete(questions).where(eq(questions.materialId, materialId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete questions error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
