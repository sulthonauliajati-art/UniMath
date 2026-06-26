import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { questions, materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateToken } from '@/lib/auth/utils'

/* ═══════════════════════════════════════════════════════════════════
 * Format CSV yang didukung (auto-detect dari header):
 *
 * vExport (20 kolom) — hasil export dari admin panel:
 *   0  id              (diabaikan — ID baru di-generate)
 *   1  materialId      ← DIBACA dari CSV, dropdown diabaikan → multi-materi!
 *   2  judulMateri     (diabaikan)
 *   3  mode
 *   4  indicator
 *   5  difficulty
 *   6  difficultyLabel (diabaikan)
 *   7  questionType
 *   8  question
 *   9  optA  10 optB  11 optC  12 optD  13 optE
 *  14  correct
 *  15  hint1  16 hint2  17 hint3
 *  18  explanation
 *  19  remedialMaterialId
 *
 * v2 (16 kolom) — template import standard dengan optE:
 *   mode, indicator, difficulty, questionType, question,
 *   optA, optB, optC, optD, optE, correct,
 *   hint1, hint2, hint3, explanation, remedialMaterialId
 *
 * v1 (15 kolom) — format lama tanpa optE (backward compat):
 *   mode, indicator, difficulty, questionType, question,
 *   optA, optB, optC, optD, correct,
 *   hint1, hint2, hint3, explanation, remedialMaterialId
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
 * RFC-4180-ish multi-line CSV parser.
 * Handles quoted fields, embedded commas, embedded newlines, escaped quotes ("").
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
        if (nextChar === '"') { current += '"'; i++ }
        else { inQuotes = false }
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
        if (fields.length > 1 || fields[0] !== '') records.push(fields)
        fields = []
        current = ''
      } else {
        current += char
      }
    }
  }

  if (current || fields.length > 0) {
    fields.push(current)
    if (fields.length > 1 || fields[0] !== '') records.push(fields)
  }

  return records
}

/* ── Normalizers ───────────────────────────────────────────────── */

const MODE_MAP: Record<string, 'PRACTICE' | 'PRETEST' | 'POSTTEST' | 'ALL'> = {
  PRACTICE: 'PRACTICE', PRETEST: 'PRETEST', PRE_TEST: 'PRETEST',
  POSTTEST: 'POSTTEST', POST_TEST: 'POSTTEST', ALL: 'ALL',
}
const INDICATOR_SET = new Set(['I1', 'I2', 'I3', 'I4'])
const DIFFICULTY_TEXT_MAP: Record<string, number> = {
  MUDAH: 1, EASY: 1, SEDANG: 2, MEDIUM: 2, SULIT: 3, HARD: 3,
}
const TYPE_MAP: Record<string, 'PG' | 'URAIAN'> = {
  PG: 'PG', PILIHAN_GANDA: 'PG', 'PILIHAN GANDA': 'PG', URAIAN: 'URAIAN', ESSAY: 'URAIAN',
}

function normalizeMode(raw: string): 'PRACTICE' | 'PRETEST' | 'POSTTEST' | 'ALL' | null {
  return MODE_MAP[raw.trim().toUpperCase()] ?? null
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
  return TYPE_MAP[raw.trim().toUpperCase()] ?? null
}
function normalizeCorrect(raw: string): 'A' | 'B' | 'C' | 'D' | 'E' | null {
  const key = raw.trim().toUpperCase()
  return (['A', 'B', 'C', 'D', 'E'] as const).includes(key as 'A')
    ? (key as 'A' | 'B' | 'C' | 'D' | 'E')
    : null
}

/* ── POST Handler ─────────────────────────────────────────────── */

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
    let materialIdFromDropdown = String(formData.get('materialId') || '').trim()
    const modeFromForm = String(formData.get('mode') || '').trim()
    const isEvalMode = modeFromForm === 'PRETEST' || modeFromForm === 'POSTTEST'
    const dryRun = String(formData.get('dryRun') || '') === '1'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: { message: 'File CSV wajib disertakan' } }, { status: 400 })
    }

    const text = await file.text()
    const records = parseCSVMultiline(text)

    if (records.length < 2) {
      return NextResponse.json(
        { error: { message: 'CSV harus memiliki header + minimal 1 baris data' } },
        { status: 400 }
      )
    }

    // ── Auto-detect format ──────────────────────────────────────────────
    const headerRow = records[0].map((h) => h.trim().toLowerCase())

    // vExport: kolom[0]='id', kolom[1]='materialid'
    const isVExport = headerRow[0] === 'id' && headerRow[1] === 'materialid'
    // v2: kolom[9]='opte'
    const isV2 = !isVExport && headerRow[9]?.toLowerCase() === 'opte'
    // v1: kolom[9]='correct'
    const isV1 = !isVExport && !isV2 && headerRow[9]?.toLowerCase() === 'correct'

    if (!isVExport && !isV2 && !isV1) {
      return NextResponse.json(
        { error: { message: 'Format header tidak dikenali. Gunakan file export dari admin (20 kolom) atau template import (16 kolom).' } },
        { status: 400 }
      )
    }

    // Untuk mode Evaluasi (PRETEST/POSTTEST): auto-assign material container jika tidak ada
    if (!isVExport && !materialIdFromDropdown && isEvalMode) {
      const [firstMaterial] = await db
        .select({ id: materials.id })
        .from(materials)
        .limit(1)
      if (firstMaterial) {
        materialIdFromDropdown = firstMaterial.id
      } else {
        return NextResponse.json(
          { error: { message: 'Tidak ada materi tersedia sebagai container evaluasi. Buat materi dulu.' } },
          { status: 400 }
        )
      }
    }

    // Format v1/v2: wajib pilih materi dari dropdown
    if (!isVExport && !materialIdFromDropdown) {
      return NextResponse.json(
        { error: { message: 'Pilih materi dari dropdown. Atau gunakan file export 20 kolom untuk import semua materi sekaligus.' } },
        { status: 400 }
      )
    }

    // Validasi materialId dropdown untuk v1/v2
    if (!isVExport && materialIdFromDropdown) {
      const [materialRow] = await db
        .select({ id: materials.id })
        .from(materials)
        .where(eq(materials.id, materialIdFromDropdown))
        .limit(1)
      if (!materialRow) {
        return NextResponse.json(
          { error: { message: `Materi "${materialIdFromDropdown}" tidak ditemukan` } },
          { status: 400 }
        )
      }
    }

    // Semua materialId valid dari DB
    const allMaterials = await db.select({ id: materials.id }).from(materials)
    const validMaterialIds = new Set(allMaterials.map((m) => m.id))

    // Pre-load soal existing: key = materialId||mode||question
    const existingAll = await db
      .select({ question: questions.question, mode: questions.mode, materialId: questions.materialId })
      .from(questions)
    const existingSet = new Set(
      existingAll.map((r) => `${r.materialId}||${r.mode.toLowerCase()}||${r.question.trim().toLowerCase()}`)
    )

    const dataRows = records.slice(1)
    const errors: string[] = []
    const skippedDuplicates: string[] = []
    const rowsToInsert: Array<typeof questions.$inferInsert> = []
    const seenInFile = new Set<string>()
    const headerWarnings: string[] = []

    dataRows.forEach((row, idx) => {
      const rowNum = idx + 2
      if (row.every((cell) => !cell.trim())) return

      let rowMaterialId: string
      let mode_raw: string, indicator_raw: string, difficulty_raw: string
      let questionType_raw: string, question_raw: string
      let optA_raw: string, optB_raw: string, optC_raw: string, optD_raw: string, optE_raw: string
      let correct_raw: string
      let hint1_raw: string, hint2_raw: string, hint3_raw: string
      let explanation_raw: string, remedialMaterialId_raw: string

      if (isVExport) {
        // 20 kolom: id[0], materialId[1], judulMateri[2], mode[3], indicator[4],
        //           difficulty[5], difficultyLabel[6], questionType[7], question[8],
        //           optA[9], optB[10], optC[11], optD[12], optE[13], correct[14],
        //           hint1[15], hint2[16], hint3[17], explanation[18], remedialMaterialId[19]
        if (row.length < 15) {
          errors.push(`Baris ${rowNum}: format export membutuhkan minimal 15 kolom — ditemukan ${row.length}.`)
          return
        }
        rowMaterialId         = (row[1]  || '').trim()
        mode_raw              = row[3]  || ''
        indicator_raw         = row[4]  || ''
        difficulty_raw        = row[5]  || ''
        questionType_raw      = row[7]  || ''
        question_raw          = row[8]  || ''
        optA_raw              = row[9]  || ''
        optB_raw              = row[10] || ''
        optC_raw              = row[11] || ''
        optD_raw              = row[12] || ''
        optE_raw              = row[13] || ''
        correct_raw           = row[14] || ''
        hint1_raw             = row[15] || ''
        hint2_raw             = row[16] || ''
        hint3_raw             = row[17] || ''
        explanation_raw       = row[18] || ''
        remedialMaterialId_raw = row[19] || ''

        if (!validMaterialIds.has(rowMaterialId)) {
          errors.push(`Baris ${rowNum}: materialId "${rowMaterialId}" tidak ada di database.`)
          return
        }
      } else {
        // v1 / v2
        if (row.length < 10) {
          errors.push(`Baris ${rowNum}: minimal 10 kolom diperlukan — ditemukan ${row.length}.`)
          return
        }
        rowMaterialId    = materialIdFromDropdown
        mode_raw         = row[0] || ''
        indicator_raw    = row[1] || ''
        difficulty_raw   = row[2] || ''
        questionType_raw = row[3] || ''
        question_raw     = row[4] || ''
        optA_raw         = row[5] || ''
        optB_raw         = row[6] || ''
        optC_raw         = row[7] || ''
        optD_raw         = row[8] || ''
        if (isV2) {
          optE_raw              = row[9]  || ''
          correct_raw           = row[10] || ''
          hint1_raw             = row[11] || ''
          hint2_raw             = row[12] || ''
          hint3_raw             = row[13] || ''
          explanation_raw       = row[14] || ''
          remedialMaterialId_raw = row[15] || ''
        } else {
          optE_raw              = ''
          correct_raw           = row[9]  || ''
          hint1_raw             = row[10] || ''
          hint2_raw             = row[11] || ''
          hint3_raw             = row[12] || ''
          explanation_raw       = row[13] || ''
          remedialMaterialId_raw = row[14] || ''
        }
      }

      const mode         = normalizeMode(mode_raw)
      const indicator    = normalizeIndicator(indicator_raw)
      const difficulty   = normalizeDifficulty(difficulty_raw)
      const questionType = normalizeQuestionType(questionType_raw) || 'PG'
      const question     = question_raw.trim()
      const optA         = optA_raw.trim()
      const optB         = optB_raw.trim()
      const optC         = optC_raw.trim()
      const optD         = optD_raw.trim()
      const optE         = optE_raw.trim()
      const correct      = normalizeCorrect(correct_raw)
      const hint1        = hint1_raw.trim() || null
      const hint2        = hint2_raw.trim() || null
      const hint3        = hint3_raw.trim() || null
      const explanation  = explanation_raw.trim() || null
      const remedialMaterialId = remedialMaterialId_raw.trim() || null

      // Validasi
      if (!mode)           errors.push(`Baris ${rowNum}: mode "${mode_raw}" tidak valid. Gunakan PRACTICE/PRETEST/POSTTEST/ALL.`)
      if (!indicator)      errors.push(`Baris ${rowNum}: indikator "${indicator_raw}" tidak valid. Gunakan I1/I2/I3/I4.`)
      if (difficulty === null) errors.push(`Baris ${rowNum}: difficulty "${difficulty_raw}" tidak valid. Gunakan 1/2/3 atau MUDAH/SEDANG/SULIT.`)
      if (!question)       errors.push(`Baris ${rowNum}: soal kosong.`)

      if (questionType === 'PG') {
        if (!optA || !optB || !optC || !optD) errors.push(`Baris ${rowNum}: opsi A/B/C/D wajib diisi untuk soal PG.`)
        if (!optE)    errors.push(`Baris ${rowNum}: opsi E wajib diisi untuk soal PG (kolom optE kosong).`)
        if (!correct) errors.push(`Baris ${rowNum}: kunci jawaban "${correct_raw}" harus A/B/C/D/E untuk soal PG.`)
        if (correct === 'E' && !optE) errors.push(`Baris ${rowNum}: kunci jawaban "E" tetapi optE kosong.`)
      }

      // Kunci duplikat: materialId + mode + teks soal
      const dedupeKey = `${rowMaterialId}||${(mode || '').toLowerCase()}||${question.toLowerCase()}`

      if (seenInFile.has(dedupeKey)) {
        skippedDuplicates.push(`Baris ${rowNum} dilewati (duplikat dalam file)`)
        return
      } else if (existingSet.has(dedupeKey)) {
        errors.push(`Baris ${rowNum}: soal ini sudah ada di materi "${rowMaterialId}" (duplikat dengan DB).`)
      } else {
        seenInFile.add(dedupeKey)
      }

      const isValid =
        mode && indicator && difficulty !== null && question && rowMaterialId &&
        (questionType !== 'PG' || (optA && optB && optC && optD && optE && correct)) &&
        !existingSet.has(dedupeKey) &&
        !errors.some((e) => e.startsWith(`Baris ${rowNum}:`))

      if (isValid) {
        rowsToInsert.push({
          id: `Q${Date.now().toString(36)}_${idx.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          materialId: rowMaterialId,
          mode: mode!,
          indicator: indicator as 'I1' | 'I2' | 'I3' | 'I4',
          difficulty: difficulty as number,
          questionType,
          question,
          optA, optB, optC, optD, optE,
          correct: (correct || 'A') as 'A' | 'B' | 'C' | 'D' | 'E',
          hint1, hint2, hint3, explanation, remedialMaterialId,
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
          materialId: r.materialId,
          mode: r.mode,
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

    // Ringkasan per materi
    const byMaterial: Record<string, number> = {}
    for (const r of rowsToInsert) {
      byMaterial[r.materialId] = (byMaterial[r.materialId] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      count: rowsToInsert.length,
      skippedDuplicates: skippedDuplicates.length,
      byMaterial,
      headerWarnings,
      formatDetected: isVExport
        ? 'vExport (20 kolom — multi-materi otomatis)'
        : isV2 ? 'v2 (16 kolom dengan optE)'
        : 'v1 (15 kolom lama)',
    })
  } catch (error) {
    console.error('Upload questions error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
