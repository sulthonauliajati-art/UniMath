# UniMath Blueprint

## Overview
UniMath adalah platform latihan numerasi gamified dengan konsep "naik gedung" unlimited floors. Target: MVP siap demo/launch.

## Core Concept
- Siswa menjawab soal matematika untuk membantu robot naik gedung
- Setiap jawaban benar = naik 1 lantai
- Lantai unlimited (tidak ada batas atas)
- Hint muncul bertahap saat salah (1→2→3)
- Setelah 3x salah, muncul rekomendasi review materi

## User Roles

### Student
- Login 2-step: NISN/Nama → Password
- Akses materi dengan progress tracking
- Game "Naik Gedung"
- Lihat profil & statistik

### Teacher
- Login/Register dengan email
- Kelola sekolah
- Kelola kelas & siswa
- Lihat rekap & laporan siswa

## Tech Stack
- Frontend: Next.js 14 + TypeScript + Tailwind
- Animation: Framer Motion + canvas-confetti
- Backend: Google Sheets + Apps Script (production)
- Mock Mode: Local JSON data (development)

## Design System
- Background: Dark navy (#0a0e27)
- Primary: Cyan/Green neon (#00d4aa, #00b4d8)
- Cards: Glassmorphism (blur + opacity)
- Font: Poppins/Inter
- Animation: Smooth, game-feel

## Screen Mapping
| Screen | Route | Design Reference |
|--------|-------|------------------|
| Landing | / | halaman pilihan sebelum login.png |
| Student Login | /student/login | - |
| Student Dashboard | /student/dashboard | - |
| Materials | /student/materials | list materi.png |
| Practice Start | /student/practice/[id]/start | setelah klik tombol latihan.png |
| Game Play | /student/practice/[id]/play | tampilan soal latihan siswa.png |
| Practice Complete | /student/practice/complete | tampilan selamat udah latihan.png |
| Student Profile | /student/profile | profile siswa.png |
| Teacher Login | /teacher/login | - |
| Teacher Dashboard | /teacher/dashboard | dashboard selamat datang guru.png |
| Teacher Classes | /teacher/classes | Daftar Kelas Guru.png |
| Class Detail | /teacher/classes/[id] | rincian kelas.png |
| Student Report | /teacher/students/[id] | profile siswa.png |
| Teacher Profile | /teacher/profile | profile guru.png |

## Game Logic

### Practice Session
1. Start: floor=1, wrongCount=0
2. Show question (no hints initially)
3. On correct: floor++, wrongCount=0, next question
4. On wrong: wrongCount++, show hint[wrongCount]
5. If wrongCount >= 3: show recommendation modal
6. End: user clicks "Udah dulu" or completes

### Question Selection
- Filter by material
- Difficulty scales: min(5, 1 + floor/5)
- Avoid last 10 questions
- Random from pool

### Hint System
- Hint 1: After 1st wrong
- Hint 2: After 2nd wrong
- Hint 3: After 3rd wrong
- Modal recommendation after 3rd wrong

## Data Model
See [API Documentation](api.md) for full schema.

## Demo Accounts
- Teacher: guru@demo.com / demo123
- Student: 1234567890 / siswa123
- Student (new): 1234567891 (needs password setup)
