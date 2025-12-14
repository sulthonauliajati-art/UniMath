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

async function seed() {
  console.log('🌱 Seeding database...')

  // Seed Users (Teachers)
  await db.insert(schema.users).values([
    {
      id: 'T001',
      role: 'TEACHER',
      name: 'Guru Demo',
      email: 'guru@demo.com',
      password: 'demo123',
      passwordStatus: 'SET',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ])

  // Seed Teacher Profiles
  await db.insert(schema.teacherProfiles).values([
    { userId: 'T001', displayName: 'Guru Demo', points: 150 },
  ])

  // Seed Students
  await db.insert(schema.users).values([
    { id: 'ST001', role: 'STUDENT', nisn: '1234567890', name: 'Budi Santoso', password: 'siswa123', passwordStatus: 'SET', createdAt: '2024-01-15T00:00:00Z' },
    { id: 'ST002', role: 'STUDENT', nisn: '1234567891', name: 'Ani Wijaya', passwordStatus: 'UNSET', createdAt: '2024-01-15T00:00:00Z' },
    { id: 'ST003', role: 'STUDENT', nisn: '1234567892', name: 'Citra Dewi', password: 'siswa123', passwordStatus: 'SET', createdAt: '2024-01-16T00:00:00Z' },
    { id: 'ST004', role: 'STUDENT', nisn: '1234567893', name: 'Dimas Pratama', password: 'siswa123', passwordStatus: 'SET', createdAt: '2024-01-16T00:00:00Z' },
    { id: 'ST005', role: 'STUDENT', nisn: '1234567894', name: 'Eka Putri', passwordStatus: 'UNSET', createdAt: '2024-01-17T00:00:00Z' },
  ])

  // Seed Schools
  await db.insert(schema.schools).values([
    { id: 'S001', name: 'SD Negeri Demo', ownerTeacherId: 'T001', createdAt: '2024-01-01T00:00:00Z' },
  ])

  // Seed Teacher-School relationship
  await db.insert(schema.teacherSchools).values([
    { teacherId: 'T001', schoolId: 'S001' },
  ])


  // Seed Classes
  await db.insert(schema.classes).values([
    { id: 'C001', schoolId: 'S001', name: 'Kelas 4A', grade: '4', createdAt: '2024-01-02T00:00:00Z' },
    { id: 'C002', schoolId: 'S001', name: 'Kelas 5B', grade: '5', createdAt: '2024-01-02T00:00:00Z' },
  ])

  // Seed Class-Student relationships
  await db.insert(schema.classStudents).values([
    { classId: 'C001', studentUserId: 'ST001' },
    { classId: 'C001', studentUserId: 'ST002' },
    { classId: 'C001', studentUserId: 'ST003' },
    { classId: 'C002', studentUserId: 'ST004' },
    { classId: 'C002', studentUserId: 'ST005' },
  ])

  // Seed Materials
  await db.insert(schema.materials).values([
    { id: 'M001', title: 'Penjumlahan Dasar', order: 1 },
    { id: 'M002', title: 'Pengurangan Dasar', order: 2 },
    { id: 'M003', title: 'Perkalian', order: 3 },
    { id: 'M004', title: 'Pembagian', order: 4 },
    { id: 'M005', title: 'Pecahan', order: 5 },
  ])

  // Seed Questions
  const questions = [
    // Penjumlahan Dasar (M001)
    { id: 'Q001', materialId: 'M001', difficulty: 1, question: '5 + 3 = ?', optA: '7', optB: '8', optC: '9', optD: '6', correct: 'B' as const, hint1: 'Coba hitung dengan jari', hint2: 'Mulai dari 5, tambah 3', hint3: 'Jawabannya antara 7-9' },
    { id: 'Q002', materialId: 'M001', difficulty: 1, question: '2 + 4 = ?', optA: '5', optB: '6', optC: '7', optD: '8', correct: 'B' as const, hint1: 'Gunakan jari untuk menghitung', hint2: '2 ditambah 4', hint3: 'Lebih dari 5' },
    { id: 'Q003', materialId: 'M001', difficulty: 2, question: '12 + 8 = ?', optA: '18', optB: '19', optC: '20', optD: '21', correct: 'C' as const, hint1: '12 + 8 = 10 + ?', hint2: 'Hasilnya bilangan bulat puluhan', hint3: 'Dua puluh' },
    { id: 'Q004', materialId: 'M001', difficulty: 2, question: '15 + 7 = ?', optA: '21', optB: '22', optC: '23', optD: '20', correct: 'B' as const, hint1: '15 + 5 = 20, lalu tambah 2', hint2: 'Lebih dari 20', hint3: 'Dua puluh dua' },
    { id: 'Q005', materialId: 'M001', difficulty: 3, question: '25 + 18 = ?', optA: '42', optB: '43', optC: '44', optD: '41', correct: 'B' as const, hint1: '25 + 20 = 45, kurang 2', hint2: 'Antara 40-45', hint3: 'Empat puluh tiga' },
    { id: 'Q006', materialId: 'M001', difficulty: 3, question: '34 + 29 = ?', optA: '62', optB: '63', optC: '64', optD: '61', correct: 'B' as const, hint1: '34 + 30 = 64, kurang 1', hint2: 'Lebih dari 60', hint3: 'Enam puluh tiga' },
    // Pengurangan Dasar (M002)
    { id: 'Q007', materialId: 'M002', difficulty: 1, question: '9 - 4 = ?', optA: '4', optB: '5', optC: '6', optD: '3', correct: 'B' as const, hint1: 'Hitung mundur dari 9', hint2: '9, 8, 7, 6, 5', hint3: 'Lima' },
    { id: 'Q008', materialId: 'M002', difficulty: 1, question: '7 - 3 = ?', optA: '3', optB: '4', optC: '5', optD: '2', correct: 'B' as const, hint1: 'Kurangi 3 dari 7', hint2: 'Lebih dari 3', hint3: 'Empat' },
    { id: 'Q009', materialId: 'M002', difficulty: 2, question: '15 - 8 = ?', optA: '6', optB: '7', optC: '8', optD: '9', correct: 'B' as const, hint1: '15 - 5 = 10, lalu kurang 3', hint2: 'Kurang dari 10', hint3: 'Tujuh' },
    { id: 'Q010', materialId: 'M002', difficulty: 2, question: '20 - 12 = ?', optA: '7', optB: '8', optC: '9', optD: '6', correct: 'B' as const, hint1: '20 - 10 = 10, lalu kurang 2', hint2: 'Kurang dari 10', hint3: 'Delapan' },
    { id: 'Q011', materialId: 'M002', difficulty: 3, question: '45 - 27 = ?', optA: '17', optB: '18', optC: '19', optD: '16', correct: 'B' as const, hint1: '45 - 25 = 20, lalu kurang 2', hint2: 'Antara 15-20', hint3: 'Delapan belas' },
    { id: 'Q012', materialId: 'M002', difficulty: 3, question: '63 - 38 = ?', optA: '24', optB: '25', optC: '26', optD: '23', correct: 'B' as const, hint1: '63 - 40 = 23, lalu tambah 2', hint2: 'Antara 20-30', hint3: 'Dua puluh lima' },
  ]
  await db.insert(schema.questions).values(questions)


  // More questions
  const moreQuestions = [
    // Perkalian (M003)
    { id: 'Q013', materialId: 'M003', difficulty: 1, question: '3 × 4 = ?', optA: '10', optB: '11', optC: '12', optD: '13', correct: 'C' as const, hint1: '3 + 3 + 3 + 3', hint2: 'Tiga kali empat', hint3: 'Dua belas' },
    { id: 'Q014', materialId: 'M003', difficulty: 1, question: '2 × 5 = ?', optA: '8', optB: '9', optC: '10', optD: '11', correct: 'C' as const, hint1: '5 + 5', hint2: 'Dua kali lima', hint3: 'Sepuluh' },
    { id: 'Q015', materialId: 'M003', difficulty: 2, question: '6 × 7 = ?', optA: '40', optB: '41', optC: '42', optD: '43', correct: 'C' as const, hint1: '6 × 7 = 6 × 6 + 6', hint2: 'Lebih dari 40', hint3: 'Empat puluh dua' },
    { id: 'Q016', materialId: 'M003', difficulty: 2, question: '8 × 5 = ?', optA: '38', optB: '39', optC: '40', optD: '41', correct: 'C' as const, hint1: '8 × 5 = 4 × 10', hint2: 'Bilangan bulat puluhan', hint3: 'Empat puluh' },
    { id: 'Q017', materialId: 'M003', difficulty: 3, question: '9 × 8 = ?', optA: '70', optB: '71', optC: '72', optD: '73', correct: 'C' as const, hint1: '9 × 8 = 10 × 8 - 8', hint2: 'Lebih dari 70', hint3: 'Tujuh puluh dua' },
    { id: 'Q018', materialId: 'M003', difficulty: 3, question: '7 × 9 = ?', optA: '61', optB: '62', optC: '63', optD: '64', correct: 'C' as const, hint1: '7 × 9 = 7 × 10 - 7', hint2: 'Lebih dari 60', hint3: 'Enam puluh tiga' },
    // Pembagian (M004)
    { id: 'Q019', materialId: 'M004', difficulty: 1, question: '12 ÷ 3 = ?', optA: '3', optB: '4', optC: '5', optD: '6', correct: 'B' as const, hint1: '3 × ? = 12', hint2: 'Berapa kali 3 sama dengan 12?', hint3: 'Empat' },
    { id: 'Q020', materialId: 'M004', difficulty: 1, question: '10 ÷ 2 = ?', optA: '4', optB: '5', optC: '6', optD: '7', correct: 'B' as const, hint1: '2 × ? = 10', hint2: 'Setengah dari 10', hint3: 'Lima' },
    { id: 'Q021', materialId: 'M004', difficulty: 2, question: '24 ÷ 6 = ?', optA: '3', optB: '4', optC: '5', optD: '6', correct: 'B' as const, hint1: '6 × ? = 24', hint2: 'Berapa kali 6 sama dengan 24?', hint3: 'Empat' },
    { id: 'Q022', materialId: 'M004', difficulty: 2, question: '35 ÷ 7 = ?', optA: '4', optB: '5', optC: '6', optD: '7', correct: 'B' as const, hint1: '7 × ? = 35', hint2: 'Berapa kali 7 sama dengan 35?', hint3: 'Lima' },
    { id: 'Q023', materialId: 'M004', difficulty: 3, question: '56 ÷ 8 = ?', optA: '6', optB: '7', optC: '8', optD: '9', correct: 'B' as const, hint1: '8 × ? = 56', hint2: 'Berapa kali 8 sama dengan 56?', hint3: 'Tujuh' },
    { id: 'Q024', materialId: 'M004', difficulty: 3, question: '72 ÷ 9 = ?', optA: '7', optB: '8', optC: '9', optD: '10', correct: 'B' as const, hint1: '9 × ? = 72', hint2: 'Berapa kali 9 sama dengan 72?', hint3: 'Delapan' },
    // Pecahan (M005)
    { id: 'Q025', materialId: 'M005', difficulty: 1, question: '1/2 + 1/2 = ?', optA: '1/4', optB: '2/4', optC: '1', optD: '2', correct: 'C' as const, hint1: 'Setengah ditambah setengah', hint2: 'Hasilnya bilangan bulat', hint3: 'Satu' },
    { id: 'Q026', materialId: 'M005', difficulty: 1, question: '1/4 + 1/4 = ?', optA: '1/2', optB: '2/4', optC: '1/8', optD: '2/8', correct: 'A' as const, hint1: 'Seperempat ditambah seperempat', hint2: 'Sama dengan 2/4', hint3: 'Setengah' },
    { id: 'Q027', materialId: 'M005', difficulty: 2, question: '3/4 - 1/4 = ?', optA: '1/4', optB: '2/4', optC: '3/4', optD: '4/4', correct: 'B' as const, hint1: '3 - 1 = 2, penyebutnya tetap', hint2: 'Sama dengan 1/2', hint3: 'Dua per empat' },
    { id: 'Q028', materialId: 'M005', difficulty: 2, question: '2/3 + 1/3 = ?', optA: '2/3', optB: '3/3', optC: '1/3', optD: '3/6', correct: 'B' as const, hint1: '2 + 1 = 3, penyebutnya tetap', hint2: 'Sama dengan 1', hint3: 'Tiga per tiga' },
    { id: 'Q029', materialId: 'M005', difficulty: 3, question: '1/2 + 1/4 = ?', optA: '2/4', optB: '3/4', optC: '2/6', optD: '1/6', correct: 'B' as const, hint1: '1/2 = 2/4', hint2: '2/4 + 1/4 = ?', hint3: 'Tiga per empat' },
    { id: 'Q030', materialId: 'M005', difficulty: 3, question: '5/6 - 1/3 = ?', optA: '1/2', optB: '2/3', optC: '3/6', optD: '4/6', correct: 'A' as const, hint1: '1/3 = 2/6', hint2: '5/6 - 2/6 = 3/6', hint3: 'Setengah' },
  ]
  await db.insert(schema.questions).values(moreQuestions)

  console.log('✅ Database seeded successfully!')
}

seed().catch(console.error)
