import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const db = drizzle(client, { schema })

// P1 Fix: Default achievements for gamification
const defaultAchievements = [
  // Floor-based achievements
  { id: 'ACH001', name: 'Mulai Pertama Kali', description: 'Selesaikan latihan pertama', icon: '🌟', type: 'FLOOR' as const, requirement: 1, points: 10 },
  { id: 'ACH002', name: 'Naik 10 Lantai', description: 'Capai total 10 lantai', icon: '🏠', type: 'FLOOR' as const, requirement: 10, points: 20 },
  { id: 'ACH003', name: 'Naik 25 Lantai', description: 'Capai total 25 lantai', icon: '🏢', type: 'FLOOR' as const, requirement: 25, points: 30 },
  { id: 'ACH004', name: 'Naik 50 Lantai', description: 'Capai total 50 lantai', icon: '🏬', type: 'FLOOR' as const, requirement: 50, points: 50 },
  { id: 'ACH005', name: 'Naik 100 Lantai', description: 'Capai total 100 lantai', icon: '🏰', type: 'FLOOR' as const, requirement: 100, points: 100 },
  
  // Accuracy-based achievements
  { id: 'ACH006', name: 'Akurasi 60%', description: 'Capai akurasi keseluruhan 60%', icon: '🎯', type: 'ACCURACY' as const, requirement: 60, points: 20 },
  { id: 'ACH007', name: 'Akurasi 70%', description: 'Capai akurasi keseluruhan 70%', icon: '🎯', type: 'ACCURACY' as const, requirement: 70, points: 30 },
  { id: 'ACH008', name: 'Akurasi 80%', description: 'Capai akurasi keseluruhan 80%', icon: '💪', type: 'ACCURACY' as const, requirement: 80, points: 50 },
  { id: 'ACH009', name: 'Akurasi 90%', description: 'Capai akurasi keseluruhan 90%', icon: '💯', type: 'ACCURACY' as const, requirement: 90, points: 100 },
  
  // Session/streak-based achievements
  { id: 'ACH010', name: 'Rajin Latihan', description: 'Selesaikan 5 sesi latihan', icon: '📚', type: 'STREAK' as const, requirement: 5, points: 20 },
  { id: 'ACH011', name: 'Konsisten', description: 'Selesaikan 10 sesi latihan', icon: '📖', type: 'STREAK' as const, requirement: 10, points: 40 },
  { id: 'ACH012', name: 'Tekun', description: 'Selesaikan 25 sesi latihan', icon: '🎓', type: 'STREAK' as const, requirement: 25, points: 60 },
  { id: 'ACH013', name: 'Master Latihan', description: 'Selesaikan 50 sesi latihan', icon: '🏆', type: 'STREAK' as const, requirement: 50, points: 100 },
]

async function seedAchievements() {
  console.log('🏆 Seeding achievements...')

  for (const ach of defaultAchievements) {
    try {
      await db.insert(schema.achievements).values(ach)
      console.log(`  ✓ Added: ${ach.name}`)
    } catch (error) {
      // Ignore duplicate errors
      console.log(`  - Skipped (exists): ${ach.name}`)
    }
  }

  console.log('✅ Achievements seeded successfully!')
}

seedAchievements().catch(console.error)
