/**
 * Normalize all material `grade` values to Kelas 10 (SMA) since UniMath's
 * current curriculum focus is Aritmatika Sosial SMA. Safe to re-run.
 *
 * Run once:  npx tsx src/lib/db/normalize-material-grades.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { ne } from 'drizzle-orm'
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

const TARGET_GRADE = '10'

async function main() {
  const all = await db.select().from(schema.materials)
  const toUpdate = all.filter((m) => m.grade !== TARGET_GRADE)

  console.log(`📚 Total materi : ${all.length}`)
  console.log(`🔧 Perlu update : ${toUpdate.length} (grade ≠ ${TARGET_GRADE})`)

  if (toUpdate.length === 0) {
    console.log('✅ Semua materi sudah Kelas 10')
    process.exit(0)
  }

  const result = await db
    .update(schema.materials)
    .set({ grade: TARGET_GRADE })
    .where(ne(schema.materials.grade, TARGET_GRADE))

  console.log(`✅ Normalisasi selesai. Semua materi kini Kelas ${TARGET_GRADE} (SMA).`)
  console.log('Drizzle result:', result)
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
