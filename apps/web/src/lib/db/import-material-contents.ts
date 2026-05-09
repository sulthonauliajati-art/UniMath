import { config } from 'dotenv'
config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from './schema'

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ ERROR: TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ditemukan di .env.local')
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = drizzle(client, { schema })

// ═══════════════════════════════════════════
// Multi-line CSV Parser (RFC 4180 compliant)
// Handles: quoted fields with commas, newlines inside quotes, escaped quotes ("")
// ═══════════════════════════════════════════
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
          // End of quoted field
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
  
  // Don't forget the last field/record
  if (current || fields.length > 0) {
    fields.push(current.trim())
    if (fields.length > 1 || fields[0] !== '') {
      records.push(fields)
    }
  }
  
  return records
}

// ═══════════════════════════════════════════
// Material metadata for R1-R3 remedials (auto-create if needed)
// ═══════════════════════════════════════════
const remedialMeta: Record<string, { title: string; order: number }> = {
  'R1': { title: '[Remedial] Operasi Persen Dasar', order: 91 },
  'R2': { title: '[Remedial] Total Bayar & Operasi Rupiah', order: 92 },
  'R3': { title: '[Remedial] Pembagian & Harga Per Unit', order: 93 },
}

// Order mapping for main materials M1A-M1F (Aritmatika Sosial Kelas 10 SMA)
const mainMaterialOrder: Record<string, number> = {
  M1A: 1,
  M1B: 2,
  M1C: 3,
  M1D: 4,
  M1E: 5,
  M1F: 6,
}

// All materials in the CSV are targeted at Kelas 10 SMA (Aritmatika Sosial)
const TARGET_GRADE = '10'

/**
 * CSV column mapping (0-indexed):
 *  0: content_id              → id
 *  1: material_id             → materialId
 *  2: material_title          → (used for auto-creating material if missing)
 *  3: material_type           → materialType ("MAIN" | "REMEDIAL")
 *  4: content_variant         → contentVariant ("SHORT" | "FULL")
 *  5: related_floor_start     → relatedFloorStart
 *  6: related_floor_end       → relatedFloorEnd
 *  7: related_indicators      → relatedIndicators
 *  8: related_remedial_ids    → relatedRemedialIds
 *  9: trigger_common_errors   → triggerCommonErrors
 * 10: estimated_reading_minutes → estimatedReadingMinutes
 * 11: display_title           → displayTitle
 * 12: short_description       → shortDescription
 * 13: why_redirected          → whyRedirected
 * 14: learning_objectives     → learningObjectives (JSON)
 * 15: concept_text            → conceptText
 * 16: formulas                → formulas (JSON)
 * 17: steps                   → steps (JSON)
 * 18: examples                → examples (JSON)
 * 19: common_mistakes         → commonMistakes (JSON)
 * 20: checkpoint_items        → checkpointItems (JSON)
 * 21: body_markdown           → bodyMarkdown (multi-line!)
 * 22: wajib_belajar_message   → wajibBelajarMessage
 * 23: is_active               → isActive
 */

async function main() {
  console.log('🚀 Import Master List Materi (M1A-M1F + R1-R3)...\n')

  // Find CSV file
  const possiblePaths = [
    path.resolve(process.cwd(), '../../unimath_master_list_materi_M1A-M1F_R1-R3.csv'),
    'D:/UniMath/unimath_master_list_materi_M1A-M1F_R1-R3.csv',
  ]

  let csvPath = ''
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p
      break
    }
  }

  if (!csvPath) {
    console.error('❌ File CSV tidak ditemukan!')
    console.error('   Lokasi yang dicoba:', possiblePaths)
    process.exit(1)
  }

  console.log(`📄 Membaca CSV: ${csvPath}`)

  const text = fs.readFileSync(csvPath, 'utf-8')
  const records = parseCSVMultiline(text)
  
  const header = records[0]
  console.log(`📋 Header (${header.length} kolom): ${header.slice(0, 5).join(' | ')} | ...`)

  // Data rows = all except header, filter out rows that don't have enough columns
  const dataRows = records.slice(1).filter((row) => row.length >= 23 && row[0])

  console.log(`📊 Total record data: ${dataRows.length}\n`)

  if (dataRows.length === 0) {
    console.error('❌ Tidak ada data yang valid!')
    process.exit(1)
  }

  // ── PHASE 1: Ensure materials exist (especially R1-R3) ──
  console.log('═══ PHASE 1: Memastikan material terdaftar ═══')
  const uniqueMaterials = Array.from(new Set(dataRows.map((row) => row[1]?.trim()).filter(Boolean)))
  
  for (const matId of uniqueMaterials) {
    const csvTitle = dataRows.find((r) => r[1]?.trim() === matId)?.[2]?.trim()
    const meta = remedialMeta[matId]
    const resolvedTitle = meta?.title || csvTitle || matId
    const resolvedOrder = meta?.order ?? mainMaterialOrder[matId] ?? 99

    const existing = await db.query.materials.findFirst({
      where: eq(schema.materials.id, matId),
    })

    if (!existing) {
      console.log(`   ⚡ Membuat material: ${matId} → "${resolvedTitle}" (Kelas ${TARGET_GRADE})`)
      await db.insert(schema.materials).values({
        id: matId,
        title: resolvedTitle,
        order: resolvedOrder,
        grade: TARGET_GRADE,
        isActive: true,
        createdAt: new Date().toISOString(),
      })
    } else {
      // Normalize existing material: title from CSV, grade to SMA 10, correct order.
      await db
        .update(schema.materials)
        .set({
          title: resolvedTitle,
          grade: TARGET_GRADE,
          order: resolvedOrder,
        })
        .where(eq(schema.materials.id, matId))
      console.log(`   ✓ Material diperbarui: ${matId} → "${resolvedTitle}" (Kelas ${TARGET_GRADE})`)
    }
  }

  // ── PHASE 2: Clear old material_contents ──
  console.log('\n═══ PHASE 2: Membersihkan konten lama ═══')
  for (const matId of uniqueMaterials) {
    await db.delete(schema.materialContents).where(eq(schema.materialContents.materialId, matId))
    console.log(`   🧹 Konten lama dihapus untuk ${matId}`)
  }

  // ── PHASE 3: Insert new content ──
  console.log('\n═══ PHASE 3: Import konten baru ═══')

  let imported = 0
  let errors = 0

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowLabel = `Record ${i + 1}`

    const contentId = row[0]?.trim()
    const materialId = row[1]?.trim()
    const materialType = row[3]?.trim() || null
    const contentVariant = row[4]?.trim() || null
    const relatedFloorStart = row[5]?.trim() ? parseInt(row[5].trim()) : null
    const relatedFloorEnd = row[6]?.trim() ? parseInt(row[6].trim()) : null
    const relatedIndicators = row[7]?.trim() || null
    const relatedRemedialIds = row[8]?.trim() || null
    const triggerCommonErrors = row[9]?.trim() || null
    const estimatedReadingMinutes = row[10]?.trim() ? parseInt(row[10].trim()) : null
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

    // Validation
    if (!contentId || !materialId) {
      console.error(`   ❌ ${rowLabel}: content_id atau material_id kosong`)
      errors++
      continue
    }

    if (isActiveRaw === 'FALSE') {
      console.log(`   ⏭️ ${contentId}: Skipped (is_active=FALSE)`)
      continue
    }

    try {
      await db.insert(schema.materialContents).values({
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
      console.log(`   ✅ ${contentId} (${materialType} ${contentVariant}) → ${displayTitle}`)
      imported++
    } catch (err: any) {
      console.error(`   ❌ ${contentId}: ${err.message}`)
      errors++
    }
  }

  // ── SUMMARY ──
  console.log('\n═══════════════════════════════════════════')
  console.log('✅ IMPORT MASTER LIST MATERI SELESAI')
  console.log(`📊 Total konten berhasil : ${imported}`)
  console.log(`📊 Total error           : ${errors}`)
  console.log('\n📊 Rincian:')
  
  // Group by materialId
  const byMat: Record<string, string[]> = {}
  dataRows.forEach((row) => {
    const mid = row[1]?.trim()
    const cid = row[0]?.trim()
    if (!mid || !cid) return
    if (!byMat[mid]) byMat[mid] = []
    byMat[mid].push(cid)
  })
  for (const [matId, cids] of Object.entries(byMat)) {
    console.log(`   ${matId}: ${cids.join(', ')}`)
  }
  console.log('═══════════════════════════════════════════\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
