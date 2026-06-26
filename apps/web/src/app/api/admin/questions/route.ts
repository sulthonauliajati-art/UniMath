import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, practiceAttempts, testAttempts } from '@/lib/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
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
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')
    const mode = searchParams.get('mode')

    if (!materialId) {
      return NextResponse.json({ questions: [] })
    }

    const conditions = [eq(questions.materialId, materialId)]
    if (mode && mode !== 'ALL') {
      conditions.push(eq(questions.mode, mode as typeof questions.$inferSelect.mode))
    }

    const allQuestions = await db
      .select()
      .from(questions)
      .where(and(...conditions))
      .orderBy(questions.difficulty)

    return NextResponse.json({ questions: allQuestions })
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Server error' } },
      { status: 500 }
    )
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
    const mode = searchParams.get('mode') as 'PRETEST' | 'POSTTEST' | null

    if (!materialId) {
      return NextResponse.json({ error: { message: 'Material ID diperlukan' } }, { status: 400 })
    }

    // Build where conditions — support mode filter untuk evaluasi global
    const whereConditions = [eq(questions.materialId, materialId)]
    if (mode && (mode === 'PRETEST' || mode === 'POSTTEST')) {
      whereConditions.push(eq(questions.mode, mode))
    }

    // 1. Ambil semua ID soal di materi ini (dan mode jika disediakan)
    const targetQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(and(...whereConditions))

    if (targetQuestions.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    const questionIds = targetQuestions.map((q) => q.id)

    // 2. Hapus practice_attempts yang mengacu ke soal ini (hindari FK violation)
    await db
      .delete(practiceAttempts)
      .where(inArray(practiceAttempts.questionId, questionIds))

    // 3. Hapus test_attempts yang mengacu ke soal ini
    await db
      .delete(testAttempts)
      .where(inArray(testAttempts.questionId, questionIds))

    // 4. Baru hapus soal — filter by materialId AND mode if specified
    await db.delete(questions).where(and(...whereConditions))

    return NextResponse.json({ success: true, deleted: questionIds.length })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[DELETE questions] Error:', errMsg, error)
    return NextResponse.json(
      { error: { message: `Gagal menghapus: ${errMsg}` } },
      { status: 500 }
    )
  }
}
