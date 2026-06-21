import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, materials } from '@/lib/db/schema'
import { validateToken } from '@/lib/auth/utils'

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const t = await validateToken(token)
  if (!t.valid || t.role !== 'ADMIN') return null
  return t
}

function escapeCsv(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const s = String(val)
  return `"${s.replace(/"/g, '""')}"`
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Mudah',
  2: 'Sedang',
  3: 'Sulit',
}

/**
 * GET /api/admin/questions/export
 * GET /api/admin/questions/export?materialId=M1A
 *
 * Export semua soal ke CSV lengkap, termasuk id dan judul materi untuk arsip.
 * File yang diexport bisa dijadikan referensi arsip (bukan untuk re-import langsung,
 * karena kolom id dan judulMateri tidak ada di template import).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const url = new URL(request.url)
    const materialIdFilter = url.searchParams.get('materialId') || null

    // Ambil semua materi untuk mapping id → title
    const allMaterials = await db.select({ id: materials.id, title: materials.title }).from(materials)
    const materialTitleMap: Record<string, string> = {}
    for (const m of allMaterials) {
      materialTitleMap[m.id] = m.title
    }

    // Query soal — filter per materi jika ada
    let allQuestions
    if (materialIdFilter) {
      const { eq } = await import('drizzle-orm')
      allQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.materialId, materialIdFilter))
        .orderBy(questions.materialId, questions.difficulty)
    } else {
      allQuestions = await db
        .select()
        .from(questions)
        .orderBy(questions.materialId, questions.difficulty)
    }

    // Header CSV — kolom arsip (id, judulMateri) + semua kolom data
    const headers = [
      'id',
      'materialId',
      'judulMateri',
      'mode',
      'indicator',
      'difficulty',
      'difficultyLabel',
      'questionType',
      'question',
      'optA',
      'optB',
      'optC',
      'optD',
      'optE',
      'correct',
      'hint1',
      'hint2',
      'hint3',
      'explanation',
      'remedialMaterialId',
    ]

    const BOM = '\uFEFF'
    const csvRows = [BOM + headers.join(',')]

    for (const q of allQuestions) {
      const row = [
        escapeCsv(q.id),
        escapeCsv(q.materialId),
        escapeCsv(materialTitleMap[q.materialId] || q.materialId),
        escapeCsv(q.mode),
        escapeCsv(q.indicator),
        q.difficulty,
        escapeCsv(DIFFICULTY_LABELS[q.difficulty] || String(q.difficulty)),
        escapeCsv(q.questionType || 'PG'),
        escapeCsv(q.question),
        escapeCsv(q.optA),
        escapeCsv(q.optB),
        escapeCsv(q.optC),
        escapeCsv(q.optD),
        escapeCsv(q.optE || ''),
        escapeCsv(q.correct),
        escapeCsv(q.hint1 || ''),
        escapeCsv(q.hint2 || ''),
        escapeCsv(q.hint3 || ''),
        escapeCsv(q.explanation || ''),
        escapeCsv(q.remedialMaterialId || ''),
      ]
      csvRows.push(row.join(','))
    }

    const now = new Date().toISOString().slice(0, 10)
    const suffix = materialIdFilter ? `_${materialIdFilter}` : '_semua'
    const filename = `unimath_soal_export${suffix}_${now}.csv`

    return new NextResponse(csvRows.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Export questions error:', error)
    return NextResponse.json({ error: { message: 'Gagal mengekspor soal' } }, { status: 500 })
  }
}
