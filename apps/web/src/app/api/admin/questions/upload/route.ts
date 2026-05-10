import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

/* ═══════════════════════════════════════════════════════════════════
 * Canonical CSV format for question upload.
 *
 * Header (order-sensitive — columns are read positionally, but header
 * MUST exist as row 0 so that users can map fields):
 *
 *   0  mode                PRACTICE | PRETEST | POSTTEST | ALL
 *   1  indicator           I1 | I2 | I3 | I4
 *   2  difficulty          1 | 2 | 3   (or MUDAH | SEDANG | SULIT)
 *   3  questionType        PG | URAIAN
 *   4  question            text
 *   5  optA, 6 optB, 7 optC, 8 optD   (required for PG, empty ok for URAIAN)
 *   9  correct             A | B | C | D   (required for PG)
 *  10 hint1, 11 hint2, 12 hint3       (optional)
 *  13 explanation                     (optional)
 *  14 remedialMaterialId              (optional; referenced when wrong 3×)
 *
 * Value normalization (case-insensitive for all enum-like fields):
 *   practice, Practice, PRACTICE → PRACTICE
 *   pg, Pg, PG                   → PG
 *   mudah, MUDAH, Mudah          → 1    (also accepts 1,2,3 directly)
 *
 * Error reporting: PER-ROW. Every failure references the human-readable
 * row number (header is row 1, first data row is row 2, etc).
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
 * commas, embedded newlines, and escaped quotes (""). Shared pattern with
 * src/lib/db/import-material-contents.ts.
 */
function parseCSVMultiline(text: string): string[][] {
  const records: string[][] = []
  let current = ''
  let inQuotes = false
  let fields: string[] = []

  // Strip UTF-8 BOM if present, normalize line endings.
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

function normalizeCorrect(raw: string): 'A' | 'B' | 'C' | 'D' | null {
  const key = raw.trim().toUpperCase()
  return (['A', 'B', 'C', 'D'] as const).includes(key as 'A') ? (key as 'A' | 'B' | 'C' | 'D') : null
}

/* ── Handler ──────────────────────────────────────────────────── */

const EXPECTED_HEADERS = [
  'mode',
  'indicator',
  'difficulty',
  'questionType',
  'question',
  'optA',
  'optB',
  'optC',
  'optD',
  'correct',
  'hint1',
  'hint2',
  'hint3',
  'explanation',
  'remedialMaterialId',
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

    // Verify material exists to avoid FK failure later
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

    // Validate header presence (warn, don't fail). We read positionally so
    // even if header is wrong, we try to parse; but we warn the admin.
    const headerRow = records[0].map((h) => h.trim())
    const headerWarnings: string[] = []
    EXPECTED_HEADERS.forEach((expected, idx) => {
      if (headerRow[idx]?.toLowerCase() !== expected.toLowerCase()) {
        headerWarnings.push(
          `Kolom ${idx + 1} seharusnya "${expected}" tetapi ditemukan "${headerRow[idx] || ''}".`
        )
      }
    })

    const dataRows = records.slice(1)
    const errors: string[] = []
    const rowsToInsert: Array<typeof questions.$inferInsert> = []
    const seenQuestions = new Set<string>() // in-file dup detection

    // Fetch existing question texts for this material to prevent dup inserts
    const existingTexts = await db
      .select({ question: questions.question })
      .from(questions)
      .where(eq(questions.materialId, materialId))
    const existingQuestionTexts = new Set(existingTexts.map((r) => r.question.trim().toLowerCase()))

    dataRows.forEach((row, idx) => {
      const rowNum = idx + 2 // human-readable line number

      // Skip fully empty rows
      if (row.every((cell) => !cell.trim())) return

      if (row.length < 10) {
        errors.push(
          `Baris ${rowNum}: minimal 10 kolom (sampai "correct") diperlukan — ditemukan ${row.length}.`
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
      const correct = normalizeCorrect(row[9] || '')
      const hint1 = (row[10] || '').trim() || null
      const hint2 = (row[11] || '').trim() || null
      const hint3 = (row[12] || '').trim() || null
      const explanation = (row[13] || '').trim() || null
      const remedialMaterialId = (row[14] || '').trim() || null

      // Per-field validation
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
        if (!correct) {
          errors.push(`Baris ${rowNum}: kunci jawaban "${row[9]}" harus A/B/C/D untuk soal PG.`)
        }
      }

      // Duplicate detection (in-file & vs existing DB rows)
      const normalizedKey = question.toLowerCase()
      if (seenQuestions.has(normalizedKey)) {
        errors.push(`Baris ${rowNum}: soal ini duplikat di dalam file.`)
      } else if (existingQuestionTexts.has(normalizedKey)) {
        errors.push(`Baris ${rowNum}: soal ini sudah ada di materi ini (duplikat).`)
      } else {
        seenQuestions.add(normalizedKey)
      }

      // If any error pushed for this row, skip insert
      if (
        mode &&
        indicator &&
        difficulty !== null &&
        question &&
        (questionType !== 'PG' || (optA && optB && optC && optD && correct)) &&
        !existingQuestionTexts.has(normalizedKey) &&
        !errors.some((e) => e.startsWith(`Baris ${rowNum}:`))
      ) {
        rowsToInsert.push({
          id: `Q${Date.now().toString(36)}_${idx.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          materialId,
          mode,
          indicator: indicator as 'I1' | 'I2' | 'I3' | 'I4',
          difficulty: difficulty as number,
          questionType,
          question,
          optA,
          optB,
          optC,
          optD,
          correct: (correct || 'A') as 'A' | 'B' | 'C' | 'D',
          hint1,
          hint2,
          hint3,
          explanation,
          remedialMaterialId,
        })
      }
    })

    // If there are errors, return them all; nothing is inserted unless dryRun is explicit success
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
      headerWarnings,
    })
  } catch (error) {
    console.error('Upload questions error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
