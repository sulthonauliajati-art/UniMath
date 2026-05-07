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
// Material titles for auto-creation
// ═══════════════════════════════════════════
const materialTitles: Record<string, { title: string; order: number }> = {
  'M1A_DISKON_HARGA_AKHIR':           { title: 'Menghitung Diskon dan Harga Akhir', order: 1 },
  'M1B_PPN_BIAYA_LAYANAN_ONGKIR':     { title: 'Menghitung PPN, Biaya Layanan, dan Ongkir', order: 2 },
  'M1C_UNTUNG_RUGI_PERSENTASE':       { title: 'Keuntungan, Kerugian, dan Persentasenya', order: 3 },
  'M1D_BUNGA_SEDERHANA':              { title: 'Perhitungan Bunga Sederhana', order: 4 },
  'M1E_BRUTO_NETO_TARA':              { title: 'Memahami Bruto, Neto, dan Tara', order: 5 },
  'M1F_PROMO_TRANSAKSI_KEPUTUSAN':    { title: 'Pengambilan Keputusan Promo & Transaksi', order: 6 },
  'R1_OPERASI_PERSEN_DASAR':          { title: '[Remedial] Operasi Persen Dasar', order: 91 },
  'R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH':{ title: '[Remedial] Total Bayar & Operasi Rupiah', order: 92 },
  'R3_PEMBAGIAN_DAN_HARGA_PER_UNIT':  { title: '[Remedial] Pembagian & Harga Per Unit', order: 93 },
}

async function main() {
  console.log('🚀 Memulai Batch Import Practice Packs...\n')

  // Path relatif dari apps/web (CWD saat script dijalankan)
  const csvDir = path.resolve(process.cwd(), '../../bank-soal-final')
  console.log(`📁 Mencari CSV di: ${csvDir}`)

  if (!fs.existsSync(csvDir)) {
    console.error(`❌ Folder ${csvDir} tidak ditemukan!`)
    process.exit(1)
  }

  const files = fs.readdirSync(csvDir).filter((f) => f.endsWith('.csv'))
  console.log(`📋 Ditemukan ${files.length} file CSV: ${files.join(', ')}\n`)

  if (files.length === 0) {
    console.error('❌ Tidak ada file CSV.')
    process.exit(1)
  }

  let totalImported = 0
  let totalErrors = 0

  // ── PHASE 1: Ensure all materials exist ──
  console.log('═══ PHASE 1: Memastikan semua material terdaftar ═══')
  for (const file of files) {
    const materialId = file.replace('.csv', '')
    const meta = materialTitles[materialId]

    const existing = await db.query.materials.findFirst({
      where: eq(schema.materials.id, materialId),
    })

    if (!existing) {
      console.log(`   ⚡ Membuat material: ${materialId}`)
      await db.insert(schema.materials).values({
        id: materialId,
        title: meta?.title || materialId,
        order: meta?.order || 99,
      })
    } else {
      console.log(`   ✓ Material sudah ada: ${materialId}`)
    }
  }

  // ── PHASE 2: Import questions per file ──
  console.log('\n═══ PHASE 2: Import soal dari CSV ═══')
  for (const file of files) {
    const materialId = file.replace('.csv', '')
    const filePath = path.join(csvDir, file)
    console.log(`\n📄 File: ${file} → materialId: ${materialId}`)

    // Bersihkan soal lama agar idempotent
    await db.delete(schema.questions).where(eq(schema.questions.materialId, materialId))
    console.log(`   🧹 Soal lama dihapus`)

    // Parse CSV
    const text = fs.readFileSync(filePath, 'utf-8')
    const rows = parseCSV(text)
    const dataRows = rows.slice(1).filter((row) => row.length >= 10 && row[0])

    if (dataRows.length === 0) {
      console.log(`   ⚠️ Tidak ada data`)
      continue
    }

    const questionsToInsert: any[] = []
    let fileErrors = 0

    dataRows.forEach((row, index) => {
      const rowNum = index + 2
      if (row.length < 10) {
        console.error(`   ❌ Baris ${rowNum}: Kolom kurang (${row.length})`)
        fileErrors++
        return
      }

      const [
        modeRaw, indicatorRaw, difficultyRaw, questionTypeRaw, question,
        optA, optB, optC, optD, correctRaw,
        hint1, hint2, hint3, explanation, remedialMaterialIdRaw,
      ] = row

      const mode = modeRaw?.toUpperCase().trim() || 'ALL'
      const indicator = indicatorRaw?.toUpperCase().trim() || 'I1'
      const difficulty = parseInt(difficultyRaw) || 1
      const questionType = questionTypeRaw?.toUpperCase().trim() || 'PG'
      const correct = correctRaw?.toUpperCase().trim() || 'A'
      const remedialMaterialId = remedialMaterialIdRaw?.trim() || null

      // Generate unique ID
      const uid = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`
      const id = `PQ_${materialId}_${index}_${uid}`

      questionsToInsert.push({
        id,
        materialId,
        mode,
        indicator,
        difficulty,
        questionType,
        question: question || '',
        optA: optA || '',
        optB: optB || '',
        optC: optC || '',
        optD: optD || '',
        correct: correct as 'A' | 'B' | 'C' | 'D',
        hint1: hint1 || null,
        hint2: hint2 || null,
        hint3: hint3 || null,
        explanation: explanation || null,
        remedialMaterialId,
      })
    })

    if (questionsToInsert.length > 0) {
      const batchSize = 50
      for (let i = 0; i < questionsToInsert.length; i += batchSize) {
        const batch = questionsToInsert.slice(i, i + batchSize)
        await db.insert(schema.questions).values(batch)
      }
      console.log(`   ✅ ${questionsToInsert.length} soal berhasil diimport`)
      totalImported += questionsToInsert.length
    }

    totalErrors += fileErrors
  }

  console.log('\n═══════════════════════════════════════════')
  console.log('✅ BATCH IMPORT SELESAI')
  console.log(`📊 Total soal berhasil : ${totalImported}`)
  console.log(`📊 Total error baris   : ${totalErrors}`)
  console.log('═══════════════════════════════════════════\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
