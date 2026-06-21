import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

/* ═══════════════════════════════════════════════════════════════════
 * Canonical CSV format for question upload (v2 — dengan optE wajib).
 *
 * Header (order-sensitive — kolom dibaca secara posisi):
 *
 *   0  mode                PRACTICE | PRETEST | POSTTEST | ALL
 *   1  indicator           I1 | I2 | I3 | I4
 *   2  difficulty          1 | 2 | 3   (atau MUDAH | SEDANG | SULIT)
 *   3  questionType        PG | URAIAN
 *   4  question            teks soal
 *   5  optA, 6 optB, 7 optC, 8 optD   (wajib untuk PG)
 *   9  optE                             (wajib untuk PG — opsi ke-5)
 *  10  correct             A | B | C | D | E   (wajib untuk PG)
 *  11  hint1, 12 hint2, 13 hint3       (opsional)
 *  14  explanation                     (opsional)
 *  15  remedialMaterialId              (opsional)
 *
 * BACKWARD COMPATIBILITY:
 *   Format lama (15 kolom, tanpa optE) masih diterima jika header kolom 9
 *   adalah "correct" bukan "optE". Dalam hal ini optE diisi string kosong.
 *
 * ══════════════════════════════════════════════════════════════════ */

async function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null

  const tokenData = await validateToken(token)
  if (!tokenData.valid || tokenData.role !== 'ADMIN') return null
  return tokenData
}

/**
 * RFC-4180-ish multi-line CSV parser: handles quoted fields, embedded
 * commas, embedded newlines, and escaped quotes ("").
 */
function parseCSVMultiline(text: string): string[][] {
  const records: string[][] = []
  let current = ''
  let inQuotes = false
  let fields: string[] = []

  const chars = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const nextChar = chars[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current)
        current = ''
      } else if (char === '\n') {
        fields.push(current)
        if (fields.length > 1 || fields[0] !== '') {
          records.push(fields)
        }
        fields = []
        current = ''
      } else {
        current += char
      }
    }
  }

  if (current || fields.length > 0) {
    fields.push(current)
    if (fields.length > 1 || fields[0] !== '') {
      records.push(fields)
    }
  }

  return records
}

/* ── Normalizers ───────────────────────────────────────────────── */

const MODE_MAP: Record<string, 'PRACTICE' | 'PRETEST' | 'POSTTEST' | 'ALL'> = {
  PRACTICE: 'PRACTICE',
  PRETEST: 'PRETEST',
  PRE_TEST: 'PRETEST',
  POSTTEST: 'POSTTEST',
  POST_TEST: 'POSTTEST',
  ALL: 'ALL',
}

const INDICATOR_SET = new Set(['I1', 'I2', 'I3', 'I4'])

const DIFFICULTY_TEXT_MAP: Record<string, number> = {
  MUDAH: 1,
  EASY: 1,
  SEDANG: 2,
  MEDIUM: 2,
  SULIT: 3,
  HARD: 3,
}

const TYPE_MAP: Record<string, 'PG' | 'URAIAN'> = {
  PG: 'PG',
  PILIHAN_GANDA: 'PG',
  'PILIHAN GANDA': 'PG',
  URAIAN: 'URAIAN',
  ESSAY: 'URAIAN',
}

function normalizeMode(raw: string): 'PRACTICE' | 'PRETEST' | 'POSTTEST' | 'ALL' | null {
  const key = raw.trim().toUpperCase()
  return MODE_MAP[key] ?? null
}

function normalizeIndicator(raw: string): string | null {
  const key = raw.trim().toUpperCase()
  return INDICATOR_SET.has(key) ? key : null
}

function normalizeDifficulty(raw: string): number | null {
  const trimmed = raw.trim().toUpperCase()
  if (!trimmed) return null
  const asNumber = Number(trimmed)
  if (!isNaN(asNumber) && [1, 2, 3].includes(asNumber)) return asNumber
  return DIFFICULTY_TEXT_MAP[trimmed] ?? null
}

function normalizeQuestionType(raw: string): 'PG' | 'URAIAN' | null {
  const key = raw.trim().toUpperCase()
  return TYPE_MAP[key] ?? null
}

function normalizeCorrect(raw: string): 'A' | 'B' | 'C' | 'D' | 'E' | null {
  const key = raw.trim().toUpperCase()
  return (['A', 'B', 'C', 'D', 'E'] as const).includes(key as 'A')
    ? (key as 'A' | 'B' | 'C' | 'D' | 'E')
    : null
}

/* ── Handler ──────────────────────────────────────────────────── */

// Header v2 (dengan optE) — 16 kolom
const EXPECTED_HEADERS_V2 = [
  'mode', 'indicator', 'difficulty', 'questionType', 'question',
  'optA', 'optB', 'optC', 'optD', 'optE', 'correct',
  'hint1', 'hint2', 'hint3', 'explanation', 'remedialMaterialId',
]

// Header v1 (tanpa optE, backward compat) — 15 kolom
const EXPECTED_HEADERS_V1 = [
  'mode', 'indicator', 'difficulty', 'questionType', 'question',
  'optA', 'optB', 'optC', 'optD', 'correct',
  'hint1', 'hint2', 'hint3', 'explanation', 'remedialMaterialId',
]

export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const formData = await request.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json(
        { error: { message: 'Body harus berupa multipart/form-data' } },
        { status: 400 }
      )
    }

    const file = formData.get('file')
    const materialId = String(formData.get('materialId') || '').trim()
    const dryRun = String(formData.get('dryRun') || '') === '1'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: { message: 'File CSV wajib disertakan' } }, { status: 400 })
    }
    if (!materialId) {
      return NextResponse.json({ error: { message: 'Material ID wajib dipilih' } }, { status: 400 })
    }

    const [materialRow] = await db
      .select({ id: materials.id })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1)

    if (!materialRow) {
      return NextResponse.json(
        { error: { message: `Materi "${materialId}" tidak ditemukan` } },
        { status: 400 }
      )
    }

    const text = await file.text()
    const records = parseCSVMultiline(text)

    if (records.length < 2) {
      return NextResponse.json(
        { error: { message: 'CSV harus memiliki header + minimal 1 baris data' } },
        { status: 400 }
      )
    }

    // ── Deteksi format v1 atau v2 berdasarkan header ─────────────────────
    const headerRow = records[0].map((h) => h.trim().toLowerCase())
    const isV2 = headerRow[9]?.toLowerCase() === 'opte'
    const isV1 = headerRow[9]?.toLowerCase() === 'correct'

    const expectedHeaders = isV2 ? EXPECTED_HEADERS_V2 : EXPECTED_HEADERS_V1
    const headerWarnings: string[] = []

    expectedHeaders.forEach((expected, idx) => {
      if (headerRow[idx]?.toLowerCase() !== expected.toLowerCase()) {
        headerWarnings.push(
          `Kolom ${idx + 1} seharusnya "${expected}" tetapi ditemukan "${records[0][idx] || ''}".`
        )
      }
    })

    if (!isV2 && !isV1) {
      headerWarnings.push(
        'Format header tidak dikenali. Pastikan kolom ke-10 adalah "optE" (format v2) atau "correct" (format v1 lama).'
      )
    }

    const dataRows = records.slice(1)
    const errors: string[] = []
    const skippedDuplicates: string[] = []   // baris duplikat dalam file — di-skip, bukan error
    const rowsToInsert: Array<typeof questions.$inferInsert> = []
    const seenQuestions = new Set<string>()

    const existingTexts = await db
      .select({ question: questions.question, mode: questions.mode })
      .from(questions)
      .where(eq(questions.materialId, materialId))
    // Kunci: mode||teks — sama dengan kunci di seenQuestions
    const existingQuestionTexts = new Set(
      existingTexts.map((r) => `${r.mode.toLowerCase()}||${r.question.trim().toLowerCase()}`)
    )

    dataRows.forEach((row, idx) => {
      const rowNum = idx + 2

      if (row.every((cell) => !cell.trim())) return

      // Minimum 10 kolom (sampai optD + either correct v1 atau optE v2)
      if (row.length < 10) {
        errors.push(
          `Baris ${rowNum}: minimal 10 kolom diperlukan — ditemukan ${row.length}.`
        )
        return
      }

      const mode = normalizeMode(row[0])
      const indicator = normalizeIndicator(row[1])
      const difficulty = normalizeDifficulty(row[2])
      const questionType = normalizeQuestionType(row[3]) || 'PG'
      const question = (row[4] || '').trim()
      const optA = (row[5] || '').trim()
      const optB = (row[6] || '').trim()
      const optC = (row[7] || '').trim()
      const optD = (row[8] || '').trim()

      // Format v2: posisi 9=optE, 10=correct; v1: posisi 9=correct
      let optE = ''
      let correct: 'A' | 'B' | 'C' | 'D' | 'E' | null = null

      if (isV2) {
        optE = (row[9] || '').trim()
        correct = normalizeCorrect(row[10] || '')
      } else {
        // v1 format: optE kosong, correct di posisi 9
        optE = ''
        correct = normalizeCorrect(row[9] || '')
      }

      const hint1Idx = isV2 ? 11 : 10
      const hint1 = (row[hint1Idx] || '').trim() || null
      const hint2 = (row[hint1Idx + 1] || '').trim() || null
      const hint3 = (row[hint1Idx + 2] || '').trim() || null
      const explanation = (row[hint1Idx + 3] || '').trim() || null
      const remedialMaterialId = (row[hint1Idx + 4] || '').trim() || null

      // Validasi
      if (!mode) {
        errors.push(`Baris ${rowNum}: mode "${row[0]}" tidak valid. Gunakan PRACTICE/PRETEST/POSTTEST/ALL.`)
      }
      if (!indicator) {
        errors.push(`Baris ${rowNum}: indikator "${row[1]}" tidak valid. Gunakan I1/I2/I3/I4.`)
      }
      if (difficulty === null) {
        errors.push(`Baris ${rowNum}: difficulty "${row[2]}" tidak valid. Gunakan 1/2/3 atau MUDAH/SEDANG/SULIT.`)
      }
      if (!question) {
        errors.push(`Baris ${rowNum}: soal kosong.`)
      }

      if (questionType === 'PG') {
        if (!optA || !optB || !optC || !optD) {
          errors.push(`Baris ${rowNum}: opsi A/B/C/D wajib diisi untuk soal PG.`)
        }
        if (!optE) {
          errors.push(`Baris ${rowNum}: opsi E wajib diisi untuk soal PG (kolom optE kosong).`)
        }
        if (!correct) {
          errors.push(
            `Baris ${rowNum}: kunci jawaban "${isV2 ? row[10] : row[9]}" harus A/B/C/D/E untuk soal PG.`
          )
        }
        // Validasi konsistensi: jika jawaban E, optE harus ada
        if (correct === 'E' && !optE) {
          errors.push(`Baris ${rowNum}: kunci jawaban "E" tetapi optE kosong.`)
        }
      }

      // Kunci duplikat = mode + teks soal
      // Soal yang sama boleh punya mode berbeda (PRACTICE vs PRETEST vs POSTTEST)
      const normalizedKey = `${(mode || '').toLowerCase()}||${question.toLowerCase()}`
      // Kunci duplikat DB = teks soal saja (tidak boleh sama dalam satu materi+mode)
      const dbKey = `${(mode || '').toLowerCase()}||${question.toLowerCase()}`

      if (seenQuestions.has(normalizedKey)) {
        // Duplikat dalam file (mode + teks sama persis) — skip
        skippedDuplicates.push(`Baris ${rowNum} dilewati (mode+teks soal sama dengan baris sebelumnya)`)
        return
      } else if (existingQuestionTexts.has(dbKey)) {
        errors.push(`Baris ${rowNum}: soal ini sudah ada di materi ini (duplikat dengan DB).`)
      } else {
        seenQuestions.add(normalizedKey)
      }

      const isValid =
        mode &&
        indicator &&
        difficulty !== null &&
        question &&
        (questionType !== 'PG' || (optA && optB && optC && optD && optE && correct)) &&
        !existingQuestionTexts.has(dbKey) &&
        !errors.some((e) => e.startsWith(`Baris ${rowNum}:`))

      if (isValid) {
        rowsToInsert.push({
          id: `Q${Date.now().toString(36)}_${idx.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          materialId,
          mode: mode!,
          indicator: indicator as 'I1' | 'I2' | 'I3' | 'I4',
          difficulty: difficulty as number,
          questionType,
          question,
          optA,
          optB,
          optC,
          optD,
          optE,
          correct: (correct || 'A') as 'A' | 'B' | 'C' | 'D' | 'E',
          hint1,
          hint2,
          hint3,
          explanation,
          remedialMaterialId,
        })
      }
    })

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: {
            message: `Validasi CSV gagal (${errors.length} error). Perbaiki dan upload ulang.`,
            errors,
            headerWarnings,
          },
        },
        { status: 400 }
      )
    }

    if (rowsToInsert.length === 0) {
      return NextResponse.json(
        { error: { message: 'Tidak ada baris valid untuk diimpor.' } },
        { status: 400 }
      )
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        count: rowsToInsert.length,
        preview: rowsToInsert.slice(0, 5).map((r) => ({
          mode: r.mode,
          indicator: r.indicator,
          difficulty: r.difficulty,
          question: r.question,
          correct: r.correct,
        })),
      })
    }

    // Insert in batches of 50
    const batchSize = 50
    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize)
      await db.insert(questions).values(batch)
    }

    return NextResponse.json({
      success: true,
      count: rowsToInsert.length,
      skippedDuplicates: skippedDuplicates.length,
      headerWarnings,
      formatDetected: isV2 ? 'v2 (dengan optE)' : 'v1 lama (tanpa optE — optE diisi kosong)',
    })
  } catch (error) {
    console.error('Upload questions error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
