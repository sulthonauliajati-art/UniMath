import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, classes, classStudents, testSessions, testAttempts, questions, materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return `"${s}"`
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized — diperlukan login admin' } }, { status: 401 })
    }

    const url = new URL(request.url)
    const testTypeFilter = url.searchParams.get('testType') // 'PRETEST' | 'POSTTEST' | null
    const studentIdFilter = url.searchParams.get('studentId') || null
    const materialIdFilter = url.searchParams.get('materialId') || null

    // ── Step 1: Ambil kelas per siswa (satu per siswa, cegah duplikat baris)
    const studentClassRows = await db
      .select({
        studentUserId: classStudents.studentUserId,
        className: classes.name,
      })
      .from(classStudents)
      .innerJoin(classes, eq(classStudents.classId, classes.id))

    const classMap: Record<string, string> = {}
    for (const r of studentClassRows) {
      if (!classMap[r.studentUserId]) {
        classMap[r.studentUserId] = r.className
      }
    }

    // ── Step 2: Ambil semua test attempt TANPA join classStudents (cegah duplikat)
    const results = await db
      .select({
        // Identitas siswa
        studentId: users.id,
        studentName: users.name,
        nisn: users.nisn,
        // Materi
        materialId: testSessions.materialId,
        materialTitle: materials.title,
        // Sesi tes
        sessionId: testSessions.id,
        testType: testSessions.testType,
        startedAt: testSessions.startedAt,
        completedAt: testSessions.completedAt,
        // Per soal
        questionId: questions.id,
        questionType: questions.questionType,
        indicator: questions.indicator,
        difficulty: questions.difficulty,
        // Jawaban
        attemptId: testAttempts.id,
        answer: testAttempts.answer,
        isCorrect: testAttempts.isCorrect,
        responseMs: testAttempts.responseMs,
        attemptCreatedAt: testAttempts.createdAt,
      })
      .from(testAttempts)
      .innerJoin(testSessions, eq(testAttempts.sessionId, testSessions.id))
      .innerJoin(users, eq(testSessions.studentUserId, users.id))
      .innerJoin(questions, eq(testAttempts.questionId, questions.id))
      .innerJoin(materials, eq(testSessions.materialId, materials.id))

    const filtered = results.filter(r => {
      if (testTypeFilter && r.testType !== testTypeFilter) return false
      if (studentIdFilter && r.studentId !== studentIdFilter) return false
      if (materialIdFilter && r.materialId !== materialIdFilter) return false
      return true
    })

    // ── Generate CSV dengan UTF-8 BOM ──
    const BOM = '\uFEFF'

    const DIFFICULTY_LABELS: Record<number, string> = { 1: 'Mudah', 2: 'Sedang', 3: 'Sulit' }

    const headers = [
      'Student ID',
      'Nama Siswa',
      'NISN',
      'Kelas',
      'ID Materi',
      'Judul Materi',
      'Session ID',
      'Tipe Tes',
      'Waktu Mulai',
      'Waktu Selesai',
      'ID Soal',
      'Tipe Soal',
      'Indikator',
      'Tingkat Kesulitan',
      'Label Kesulitan',
      'Attempt ID',
      'Jawaban Siswa',
      'Benar?',
      'Waktu Respons (ms)',
      'Waktu Attempt',
    ]

    const csvRows = [BOM + headers.join(',')]

    filtered.forEach(r => {
      const className = classMap[r.studentId] || '-'

      const row = [
        escapeCsv(r.studentId),
        escapeCsv(r.studentName),
        escapeCsv(r.nisn),
        escapeCsv(className),
        escapeCsv(r.materialId),
        escapeCsv(r.materialTitle),
        escapeCsv(r.sessionId),
        escapeCsv(r.testType),
        escapeCsv(r.startedAt),
        escapeCsv(r.completedAt || ''),
        escapeCsv(r.questionId),
        escapeCsv(r.questionType || 'PG'),
        escapeCsv(r.indicator),
        r.difficulty,
        escapeCsv(DIFFICULTY_LABELS[r.difficulty] || 'Sedang'),
        escapeCsv(r.attemptId),
        escapeCsv(r.answer),
        r.isCorrect === null ? '' : r.isCorrect ? '1' : '0',
        r.responseMs || 0,
        escapeCsv(r.attemptCreatedAt),
      ]
      csvRows.push(row.join(','))
    })

    const now = new Date().toISOString().slice(0, 10)
    const suffix = testTypeFilter ? `_${testTypeFilter.toLowerCase()}` : ''
    return new NextResponse(csvRows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=rekap_penelitian${suffix}_${now}.csv`,
      },
    })
  } catch (error) {
    console.error('Export research error:', error)
    return NextResponse.json({ error: 'Gagal mengekspor data penelitian' }, { status: 500 })
  }
}
