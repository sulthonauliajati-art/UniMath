import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { materials, materialContents } from '@/lib/db/schema'
import { validateToken } from '@/lib/auth/utils'

// ═══════════════════════════════════════════════════════════════════
// Admin auth helper (same pattern as other admin routes)
// ═══════════════════════════════════════════════════════════════════
async function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null

  const tokenData = await validateToken(token)
  if (!tokenData.valid || tokenData.role !== 'ADMIN') return null
  return tokenData
}

// ═══════════════════════════════════════════════════════════════════
// Multi-line CSV Parser (RFC 4180 compliant)
// Copy of parseCSVMultiline from src/lib/db/import-material-contents.ts
// Handles: quoted fields with commas, newlines inside quotes, escaped
// quotes ("")
// ═══════════════════════════════════════════════════════════════════
function parseCSVMultiline(text: string): string[][] {
  const records: string[][] = []
  let current = ''
  let inQuotes = false
  let fields: string[] = []

  // Normalize line endings
  const chars = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const nextChar = chars[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote ("") → literal "
          current += '"'
          i++ // skip next quote
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
        fields.push(current.trim())
        current = ''
      } else if (char === '\n') {
        fields.push(current.trim())
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
    fields.push(current.trim())
    if (fields.length > 1 || fields[0] !== '') {
      records.push(fields)
    }
  }

  return records
}

// ═══════════════════════════════════════════════════════════════════
// Remedial metadata (auto-create R1-R3 materials if they don't exist)
// Mirrors src/lib/db/import-material-contents.ts
// ═══════════════════════════════════════════════════════════════════
const remedialMeta: Record<string, { title: string; order: number }> = {
  R1: { title: '[Remedial] Operasi Persen Dasar', order: 91 },
  R2: { title: '[Remedial] Total Bayar & Operasi Rupiah', order: 92 },
  R3: { title: '[Remedial] Pembagian & Harga Per Unit', order: 93 },
}

interface ImportLog {
  materialsCreated: string[]
  materialsExisting: string[]
  contentsCleared: string[]
  contentsImported: Array<{ id: string; materialId: string; displayTitle: string | null }>
  contentsSkipped: Array<{ id: string; reason: string }>
  errors: Array<{ row: number; id?: string; message: string }>
}

/**
 * POST /api/admin/materials/import
 *
 * Accepts `multipart/form-data` with a single `file` field pointing to a
 * CSV exported in the format of
 * `unimath_master_list_materi_M1A-M1F_R1-R3.csv`.
 *
 * Runs the same 3-phase pipeline as the CLI script
 * `import-material-contents.ts`:
 *   1. Ensure every referenced material exists (auto-create R1-R3 using
 *      `remedialMeta`, or fall back to the material_title column).
 *   2. Clear existing material_contents rows for the involved materialIds.
 *   3. Insert new material_contents rows from the CSV.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // ── Parse multipart/form-data ──
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: { message: 'Request harus berupa multipart/form-data' } },
        { status: 400 }
      )
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: { message: 'Field "file" tidak ditemukan atau bukan file' } },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: { message: 'File CSV kosong' } },
        { status: 400 }
      )
    }

    const text = await file.text()
    const records = parseCSVMultiline(text)

    if (records.length < 2) {
      return NextResponse.json(
        { error: { message: 'CSV tidak memiliki baris data (hanya header atau kosong)' } },
        { status: 400 }
      )
    }

    // Skip header, require at least 23 columns + non-empty id
    const dataRows = records.slice(1).filter((row) => row.length >= 23 && row[0])

    if (dataRows.length === 0) {
      return NextResponse.json(
        {
          error: {
            message:
              'Tidak ada baris data valid. Pastikan CSV memiliki minimal 23 kolom dan content_id tidak kosong.',
          },
        },
        { status: 400 }
      )
    }

    const log: ImportLog = {
      materialsCreated: [],
      materialsExisting: [],
      contentsCleared: [],
      contentsImported: [],
      contentsSkipped: [],
      errors: [],
    }

    // ── PHASE 1: Ensure every referenced material exists ──────────────
    const uniqueMaterials = Array.from(
      new Set(dataRows.map((row) => row[1]?.trim()).filter(Boolean) as string[])
    )

    for (const matId of uniqueMaterials) {
      const existing = await db.query.materials.findFirst({
        where: eq(materials.id, matId),
      })

      if (!existing) {
        const meta = remedialMeta[matId]
        const fallbackTitle = dataRows.find((r) => r[1]?.trim() === matId)?.[2]?.trim()
        const title = meta?.title || fallbackTitle || matId
        const order = meta?.order ?? 99

        await db.insert(materials).values({
          id: matId,
          title,
          order,
          grade: '4',
          isActive: true,
          createdAt: new Date().toISOString(),
        })
        log.materialsCreated.push(matId)
      } else {
        log.materialsExisting.push(matId)
      }
    }

    // ── PHASE 2: Clear old material_contents for these materialIds ────
    for (const matId of uniqueMaterials) {
      await db
        .delete(materialContents)
        .where(eq(materialContents.materialId, matId))
      log.contentsCleared.push(matId)
    }

    // ── PHASE 3: Insert new material_contents rows ────────────────────
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNumber = i + 2 // +2 accounts for header + 1-based line numbers

      const contentId = row[0]?.trim()
      const materialId = row[1]?.trim()
      const materialType = row[3]?.trim() || null
      const contentVariant = row[4]?.trim() || null
      const relatedFloorStart = row[5]?.trim() ? parseInt(row[5].trim(), 10) : null
      const relatedFloorEnd = row[6]?.trim() ? parseInt(row[6].trim(), 10) : null
      const relatedIndicators = row[7]?.trim() || null
      const relatedRemedialIds = row[8]?.trim() || null
      const triggerCommonErrors = row[9]?.trim() || null
      const estimatedReadingMinutes = row[10]?.trim()
        ? parseInt(row[10].trim(), 10)
        : null
      const displayTitle = row[11]?.trim() || null
      const shortDescription = row[12]?.trim() || null
      const whyRedirected = row[13]?.trim() || null
      const learningObjectives = row[14]?.trim() || null
      const conceptText = row[15]?.trim() || null
      const formulas = row[16]?.trim() || null
      const steps = row[17]?.trim() || null
      const examples = row[18]?.trim() || null
      const commonMistakes = row[19]?.trim() || null
      const checkpointItems = row[20]?.trim() || null
      const bodyMarkdown = row[21]?.trim() || null
      const wajibBelajarMessage = row[22]?.trim() || null
      const isActiveRaw = row[23]?.toUpperCase().trim()

      if (!contentId || !materialId) {
        log.errors.push({
          row: rowNumber,
          message: 'content_id atau material_id kosong',
        })
        continue
      }

      if (isActiveRaw === 'FALSE') {
        log.contentsSkipped.push({ id: contentId, reason: 'is_active=FALSE' })
        continue
      }

      try {
        await db.insert(materialContents).values({
          id: contentId,
          materialId,
          materialType,
          contentVariant,
          displayTitle,
          shortDescription,
          whyRedirected,
          learningObjectives,
          conceptText,
          formulas,
          steps,
          examples,
          commonMistakes,
          checkpointItems,
          bodyMarkdown,
          wajibBelajarMessage,
          triggerCommonErrors,
          relatedFloorStart,
          relatedFloorEnd,
          relatedIndicators,
          relatedRemedialIds,
          estimatedReadingMinutes,
          isActive: true,
        })

        log.contentsImported.push({
          id: contentId,
          materialId,
          displayTitle,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        log.errors.push({ row: rowNumber, id: contentId, message })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: dataRows.length,
        materialsCreated: log.materialsCreated.length,
        materialsExisting: log.materialsExisting.length,
        contentsCleared: log.contentsCleared.length,
        contentsImported: log.contentsImported.length,
        contentsSkipped: log.contentsSkipped.length,
        errors: log.errors.length,
      },
      log,
    })
  } catch (error) {
    console.error('Import materials error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
