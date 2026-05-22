/**
 * Restore checkpoint_items JSON from the CSV without touching bodyMarkdown.
 *
 * Background: an earlier migration cleared all checkpoint_items because the
 * Checkpoint section in bodyMarkdown was leaking the answer keys to students
 * (the rendered text included "Jawaban: B", explanations, etc.).
 *
 * Correction: only the *narrative* Checkpoint section in bodyMarkdown was
 * the leak; the JSON `checkpointItems` is consumed by an *interactive* quiz
 * widget that just shows ✅ / ❌ without revealing the letter or explanation.
 * That widget is pedagogically valuable, so we restore the JSON column.
 *
 * Run:  npx tsx src/lib/db/restore-checkpoint-items.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from './schema'

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ditemukan')
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = drizzle(client, { schema })

/**
 * RFC 4180-ish multi-line CSV parser (same as import-material-contents.ts).
 * Handles quoted fields, embedded commas, embedded newlines, escaped quotes.
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

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('🔄 Restore checkpoint_items from CSV')
  console.log('═══════════════════════════════════════════════\n')

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
    console.error('❌ CSV tidak ditemukan')
    process.exit(1)
  }

  console.log(`📄 CSV: ${csvPath}`)

  const text = fs.readFileSync(csvPath, 'utf-8')
  const records = parseCSVMultiline(text)
  const dataRows = records.slice(1).filter((row) => row.length >= 23 && row[0])

  console.log(`📊 Total record: ${dataRows.length}\n`)

  let restored = 0
  let skipped = 0

  for (const row of dataRows) {
    const contentId = row[0]?.trim()
    // Column index 20: checkpoint_items (JSON array)
    const checkpointItems = row[20]?.trim() || null

    if (!contentId) continue

    if (!checkpointItems) {
      console.log(`   ⏭️  ${contentId}: tidak ada checkpoint_items di CSV, skip`)
      skipped++
      continue
    }

    // Validate it's actually JSON before storing
    try {
      JSON.parse(checkpointItems)
    } catch {
      console.log(`   ⚠️  ${contentId}: checkpoint_items bukan JSON valid, skip`)
      skipped++
      continue
    }

    // Verify the row exists in the DB before updating
    const existing = await db
      .select({ id: schema.materialContents.id })
      .from(schema.materialContents)
      .where(eq(schema.materialContents.id, contentId))
      .limit(1)

    if (existing.length === 0) {
      console.log(`   ⚠️  ${contentId}: tidak ada di DB, skip`)
      skipped++
      continue
    }

    await db
      .update(schema.materialContents)
      .set({ checkpointItems })
      .where(eq(schema.materialContents.id, contentId))

    console.log(`   ✅ ${contentId}: checkpoint_items dipulihkan`)
    restored++
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log(`✅ SELESAI`)
  console.log(`   Dipulihkan : ${restored}`)
  console.log(`   Dilewati   : ${skipped}`)
  console.log('═══════════════════════════════════════════════\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
