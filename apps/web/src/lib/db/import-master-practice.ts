import { config } from 'dotenv'
config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, and, or } from 'drizzle-orm'
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
// CSV Parser (handles quoted fields with commas)
// ═══════════════════════════════════════════
function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  return lines.map((line) => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

// ═══════════════════════════════════════════
// Difficulty mapping: text → number
// ═══════════════════════════════════════════
function parseDifficulty(raw: string): number {
  const d = raw?.toUpperCase().trim()
  if (d === 'MUDAH') return 1
  if (d === 'SEDANG') return 2
  if (d === 'SULIT') return 3
  // try numeric fallback
  const num = parseInt(d)
  if (num >= 1 && num <= 3) return num
  return 2 // default Sedang
}

// ═══════════════════════════════════════════
// Material metadata (M1A - M1F)
// ═══════════════════════════════════════════
const materialMeta: Record<string, { title: string; order: number }> = {
  'M1A': { title: 'Menghitung Diskon dan Harga Akhir', order: 1 },
  'M1B': { title: 'Menghitung PPN, Biaya Layanan, dan Ongkir', order: 2 },
  'M1C': { title: 'Keuntungan, Kerugian, dan Persentasenya', order: 3 },
  'M1D': { title: 'Perhitungan Bunga Sederhana', order: 4 },
  'M1E': { title: 'Memahami Bruto, Neto, dan Tara', order: 5 },
  'M1F': { title: 'Pengambilan Keputusan Promo & Transaksi', order: 6 },
}

/**
 * New CSV columns (0-indexed):
 *  0: question_id        — e.g. "M1A-F01-MD-V01"
 *  1: mode               — "PRACTICE"
 *  2: material_id        — "M1A"
 *  3: floor_number       — "1"
 *  4: difficulty          — "MUDAH", "SEDANG", "SULIT"
 *  5: variant_number      — "1"
 *  6: indicator           — "I2", "I1/I2", etc
 *  7: cognitive_level     — "C3", "C4"
 *  8: question_type       — "PG"
 *  9: context_tag         — "diskon", "ppn", etc
 * 10: question_text       — the stem
 * 11: option_a
 * 12: option_b
 * 13: option_c
 * 14: option_d
 * 15: correct_answer      — "A", "B", "C", "D"
 * 16: correct_value       — the text of the correct answer
 * 17: hint_1
 * 18: hint_2
 * 19: explanation
 * 20: common_error_tag
 * 21: remedial_material_id
 * 22: is_active
 */

async function main() {
  console.log('🚀 Import Master Bank Soal Practice (M1A-M1F)...\n')

  // Try multiple paths for the CSV
  const possiblePaths = [
    path.resolve(process.cwd(), '../../bank-soal-final/unimath_master_bank_soal_practice_M1A-M1F.csv'),
    'D:/UniMath/bank-soal-final/unimath_master_bank_soal_practice_M1A-M1F.csv',
    'C:/Users/SULTHON AULIA JATI/Downloads/unimath_master_bank_soal_practice_M1A-M1F.csv',
  ]

  let csvPath = ''
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p
      break
    }
  }

  if (!csvPath) {
    console.error('❌ File CSV tidak ditemukan di lokasi manapun!')
    console.error('   Coba salah satu:', possiblePaths)
    process.exit(1)
  }

  console.log(`📄 Membaca CSV: ${csvPath}`)

  const text = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(text)
  const header = rows[0]
  const dataRows = rows.slice(1).filter((row) => row.length >= 16 && row[0])

  console.log(`📋 Header: ${header.join(' | ')}`)
  console.log(`📊 Total baris data: ${dataRows.length}\n`)

  // ── PHASE 1: Ensure all materials exist ──
  console.log('═══ PHASE 1: Memastikan material M1A-M1F terdaftar ═══')
  const uniqueMaterials = Array.from(new Set(dataRows.map((row) => row[2]?.trim()).filter(Boolean)))
  
  for (const matId of uniqueMaterials) {
    const existing = await db.query.materials.findFirst({
      where: eq(schema.materials.id, matId),
    })

    if (!existing) {
      const meta = materialMeta[matId]
      console.log(`   ⚡ Membuat material: ${matId} → "${meta?.title || matId}"`)
      await db.insert(schema.materials).values({
        id: matId,
        title: meta?.title || matId,
        order: meta?.order || 99,
      })
    } else {
      console.log(`   ✓ Material sudah ada: ${matId} → "${existing.title}"`)
    }
  }

  // ── PHASE 2: Delete OLD PRACTICE questions for these materials ──
  console.log('\n═══ PHASE 2: Membersihkan soal PRACTICE lama (M1A-M1F) ═══')
  for (const matId of uniqueMaterials) {
    // Only delete PRACTICE mode questions, keep PRETEST/POSTTEST
    const deleted = await db.delete(schema.questions).where(
      and(
        eq(schema.questions.materialId, matId),
        or(
          eq(schema.questions.mode, 'PRACTICE'),
          eq(schema.questions.mode, 'ALL')
        )
      )
    )
    console.log(`   🧹 Soal PRACTICE lama dihapus untuk ${matId}`)
  }

  // ── PHASE 3: Import new questions ──
  console.log('\n═══ PHASE 3: Import soal baru dari CSV ═══')

  const questionsToInsert: any[] = []
  let errors = 0
  const statsByMaterial: Record<string, { mudah: number; sedang: number; sulit: number }> = {}

  dataRows.forEach((row, index) => {
    const rowNum = index + 2 // +1 for header, +1 for 1-based

    // Parse columns
    const questionId = row[0]?.trim()
    const mode = row[1]?.toUpperCase().trim() || 'PRACTICE'
    const materialId = row[2]?.trim()
    const difficulty = parseDifficulty(row[4])
    const indicatorRaw = row[6]?.trim() || 'I1'
    const questionType = row[8]?.toUpperCase().trim() || 'PG'
    const questionText = row[10]?.trim()
    const optA = row[11]?.trim()
    const optB = row[12]?.trim()
    const optC = row[13]?.trim()
    const optD = row[14]?.trim()
    const correct = row[15]?.toUpperCase().trim() || 'A'
    const hint1 = row[17]?.trim() || null
    const hint2 = row[18]?.trim() || null
    const explanation = row[19]?.trim() || null
    const remedialMaterialId = row[21]?.trim() || null
    const isActive = row[22]?.toUpperCase().trim()

    // Validation
    if (!questionId || !materialId || !questionText) {
      console.error(`   ❌ Baris ${rowNum}: Data wajib kosong (id/material/soal)`)
      errors++
      return
    }

    if (!['A', 'B', 'C', 'D'].includes(correct)) {
      console.error(`   ❌ Baris ${rowNum}: correct_answer invalid: "${correct}"`)
      errors++
      return
    }

    if (isActive === 'FALSE') {
      return // skip inactive
    }

    // Use the first indicator if compound (e.g. "I1/I2" → "I1")
    let indicator = indicatorRaw
    if (indicator.includes('/')) {
      indicator = indicator.split('/')[0]
    }
    // Validate indicator
    if (!['I1', 'I2', 'I3', 'I4'].includes(indicator)) {
      indicator = 'I1' // fallback
    }

    // Track stats
    if (!statsByMaterial[materialId]) {
      statsByMaterial[materialId] = { mudah: 0, sedang: 0, sulit: 0 }
    }
    if (difficulty === 1) statsByMaterial[materialId].mudah++
    else if (difficulty === 2) statsByMaterial[materialId].sedang++
    else if (difficulty === 3) statsByMaterial[materialId].sulit++

    questionsToInsert.push({
      id: questionId,
      materialId,
      mode: mode as 'PRACTICE' | 'PRETEST' | 'POSTTEST' | 'ALL',
      indicator: indicator as 'I1' | 'I2' | 'I3' | 'I4',
      difficulty,
      questionType,
      question: questionText,
      optA: optA || '',
      optB: optB || '',
      optC: optC || '',
      optD: optD || '',
      correct: correct as 'A' | 'B' | 'C' | 'D',
      hint1,
      hint2,
      hint3: null, // new CSV doesn't have hint3
      explanation,
      remedialMaterialId,
    })
  })

  // Batch insert
  if (questionsToInsert.length > 0) {
    console.log(`\n   📥 Inserting ${questionsToInsert.length} soal...`)
    const batchSize = 50
    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      const batch = questionsToInsert.slice(i, i + batchSize)
      await db.insert(schema.questions).values(batch)
      process.stdout.write(`   ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questionsToInsert.length / batchSize)} (${batch.length} soal)\n`)
    }
  }

  // ── SUMMARY ──
  console.log('\n═══════════════════════════════════════════')
  console.log('✅ IMPORT MASTER BANK SOAL SELESAI')
  console.log(`📊 Total soal berhasil : ${questionsToInsert.length}`)
  console.log(`📊 Total error baris   : ${errors}`)
  console.log('\n📊 Rincian per Material:')
  for (const [matId, stats] of Object.entries(statsByMaterial)) {
    const total = stats.mudah + stats.sedang + stats.sulit
    console.log(`   ${matId}: ${total} soal (Mudah: ${stats.mudah}, Sedang: ${stats.sedang}, Sulit: ${stats.sulit})`)
  }
  console.log('═══════════════════════════════════════════\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
