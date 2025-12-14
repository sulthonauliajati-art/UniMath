# Implementation Plan - UniMath Platform

## Milestone 1: Repository Bootstrap & Project Setup

- [x] 1.1 Initialize pnpm workspace monorepo
  - Create root package.json with workspace config
  - Create pnpm-workspace.yaml
  - Setup apps/web, apps/script, docs, design folders
  - _Requirements: Project Structure_

- [x] 1.2 Setup Next.js 14 with TypeScript
  - Initialize Next.js 14 app in apps/web
  - Configure TypeScript strict mode
  - Setup App Router structure
  - _Requirements: Tech Stack_

- [x] 1.3 Configure Tailwind CSS with design tokens
  - Install and configure Tailwind CSS
  - Add design tokens (CSS variables) in globals.css
  - Extend tailwind.config.js with custom colors, shadows, fonts
  - Import Google Fonts (Poppins, Inter)
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [x] 1.4 Setup Framer Motion and canvas-confetti
  - Install framer-motion and canvas-confetti
  - Create animation utility file with common variants
  - _Requirements: 19.5_

- [x] 1.5 Create routing skeleton
  - Setup all route folders (landing, student/*, teacher/*)
  - Create placeholder page.tsx for each route
  - _Requirements: Route mapping from design_

- [x] 1.6 Setup mock data mode infrastructure
  - Create data/mock folder structure
  - Create seed data file with demo content
  - Create API mode detection utility
  - _Requirements: 17.3, 21.1, 21.2_

- [x] 1.7 Copy design references and create docs
  - Copy PNG files to design/ folder
  - Create docs/blueprint.md
  - Create docs/api.md (from design doc)
  - Create docs/progress.md
  - _Requirements: Documentation_

- [x] 1.8 Setup root scripts
  - Add pnpm dev, pnpm web:dev, pnpm build scripts
  - Verify dev server runs
  - _Requirements: Project Structure_

---

## Milestone 2: Base UI Components

- [x] 2.1 Create StarryBackground component
  - Animated star particles on dark navy background
  - Optional neon streaks effect
  - Full viewport coverage
  - _Requirements: 19.1_

- [x] 2.2 Create GlassCard component
  - Glassmorphism effect (blur, opacity, border)
  - Configurable glow color (cyan/green/purple)
  - Responsive padding and sizing
  - _Requirements: 19.2_

- [x] 2.3 Create NeonButton component
  - Large rounded buttons with gradient
  - Glow effect on hover/active
  - Variants: primary, secondary, ghost
  - Sizes: sm, md, lg, xl
  - _Requirements: 19.3_

- [x] 2.4 Create Input component
  - Styled input with neon border on focus
  - Label and error message support
  - Password visibility toggle
  - _Requirements: 19.2, 19.3_

- [x] 2.5 Create ProgressBar component
  - Animated fill with gradient
  - Optional percentage label
  - Configurable colors
  - _Requirements: 10.2_

- [x] 2.6 Create base layout components
  - PageContainer with StarryBackground
  - Sidebar component for teacher panel
  - Header component with user info
  - _Requirements: 19.1, 5.3_

---

## Milestone 3: Authentication Flows

- [x] 3.1 Create auth context and hooks
  - AuthContext with user state and token
  - useAuth hook for accessing auth state
  - Token storage in localStorage
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3.2 Create mock auth API handlers
  - POST /api/auth/student/identify
  - POST /api/auth/student/set-password
  - POST /api/auth/student/login
  - POST /api/auth/teacher/register
  - POST /api/auth/teacher/login
  - _Requirements: 17.3_

- [x] 3.3 Implement Landing page
  - UI matching "halaman pilihan sebelum login.png"
  - Two large buttons: Login Siswa, Login Guru
  - Animated background and glassmorphism cards
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3.4 Implement Student Login (2-step)
  - Step 1: Single input for NISN/Name
  - Step 2a: Password input if user exists with SET password
  - Step 2b: Set Password form if password_status = UNSET
  - Error state: "Akun tidak ditemukan"
  - Lupa password message
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 3.5 Implement Teacher Login/Register
  - Tab/button toggle between Login and Daftar
  - Login form: email, password
  - Register form: name, email, password
  - Error handling for invalid credentials and duplicate email
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.6 Implement route protection middleware
  - Create middleware.ts for route guards
  - Redirect unauthenticated users to login
  - Separate guards for /student/* and /teacher/*
  - _Requirements: 4.1, 4.2_

- [x] 3.7 Implement logout functionality
  - Clear token from storage
  - Redirect to appropriate login page
  - _Requirements: 4.3_

---

## Milestone 4: Teacher Panel

- [x] 4.1 Create mock teacher API handlers
  - GET/POST /api/teacher/schools
  - GET/POST /api/teacher/classes
  - GET /api/teacher/classes/:id
  - POST /api/teacher/classes/:id/students
  - _Requirements: 17.3_

- [x] 4.2 Implement Teacher Dashboard
  - UI matching "dashboard selamat datang guru.png"
  - Display teacher name, welcome message
  - Stats cards: total students, total classes
  - Sidebar with 3 menu items only
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4.3 Implement Teacher Sidebar navigation
  - Menu items: Kelola Sekolah, Kelola Kelas, Rekap & Laporan
  - Active state styling
  - Mobile responsive (hamburger menu)
  - _Requirements: 5.3_

- [x] 4.4 Implement School Management page
  - List of schools owned by teacher
  - Create new school form
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4.5 Implement Class List page
  - UI matching "Daftar Kelas Guru.png"
  - Grid/list of class cards
  - Student count per class
  - Create new class button/form
  - _Requirements: 7.1, 7.2_

- [x] 4.6 Implement Class Detail page
  - UI matching "rincian kelas.png"
  - Class info header
  - Student list with progress indicators
  - Add student form (NISN + Name)
  - Click student → navigate to detail
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 4.7 Implement Student Detail Report page
  - UI matching "profile siswa.png"
  - Student profile info (name, NISN)
  - Stats: total floors, sessions, accuracy
  - Progress per material
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 4.8 Implement Teacher Profile page
  - UI matching "profile guru.png"
  - Teacher info: name, email
  - Stats: total students, classes, points
  - _Requirements: 9.1, 9.2_

---

## Milestone 5: Student Materials

- [x] 5.1 Create mock student API handlers
  - GET /api/student/me
  - GET /api/student/materials
  - GET /api/student/materials/:id
  - _Requirements: 17.3_

- [x] 5.2 Implement Student Dashboard
  - Welcome message with student name
  - Quick stats (floors reached, recent activity)
  - Navigation to materials
  - _Requirements: 16.1, 16.2_

- [x] 5.3 Implement Materials List page
  - UI matching "list materi.png"
  - Material cards with title and progress bar
  - Buttons: Ringkasan, Lengkap, Video/Catatan
  - Mulai Latihan button per material
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 5.4 Implement material content placeholders
  - Ringkasan modal/page (placeholder content)
  - Lengkap modal/page (placeholder content)
  - Video modal (placeholder or embed)
  - _Requirements: 10.2_

---

## Milestone 6: Game "Naik Gedung" - Core

- [x] 6.1 Create mock practice API handlers
  - POST /api/practice/start
  - POST /api/practice/answer
  - POST /api/practice/end
  - Implement question selection logic
  - Implement hint unlock logic
  - _Requirements: 17.3_

- [x] 6.2 Implement Practice Start screen
  - UI matching "setelah klik tombol latihan.png"
  - Large "Mulai Latihan" button
  - Mode toggle (Pre-test/Post-test) - UI only
  - Material title display
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 6.3 Create RobotCharacter component
  - Robot sprite/illustration from behind (POV)
  - Animation states: idle, climbing, celebrating
  - Smooth transitions between states
  - _Requirements: 12.3, 13.3_

- [x] 6.4 Create BuildingView component
  - Building/stairs visualization
  - Current floor indicator
  - Parallax or depth effect
  - _Requirements: 12.3, 12.6_

- [x] 6.5 Create FloorIndicator component
  - Display "Lantai X" (no total)
  - Material title context
  - Animated number change
  - _Requirements: 12.2_

- [x] 6.6 Create QuestionCard component
  - Question text display
  - 4 pill button options (A, B, C, D)
  - Selected state styling
  - Disabled state during submission
  - _Requirements: 12.4_

- [x] 6.7 Implement Game View main screen
  - UI matching "tampilan soal latihan siswa.png"
  - Compose: BuildingView, RobotCharacter, FloorIndicator, QuestionCard
  - "Kirim Jawaban" button
  - "Udah dulu" button
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

---

## Milestone 7: Game "Naik Gedung" - Interactions

- [x] 7.1 Create HintPanel component
  - Progressive hint display (1, 2, 3)
  - Animated reveal
  - Styled hint boxes
  - _Requirements: 14.2, 14.3, 14.4_

- [x] 7.2 Create CorrectModal component
  - UI matching "tampilan jawaban siswa benar.png"
  - Confetti animation (canvas-confetti)
  - Large checkmark icon
  - "Naik ke lantai berikutnya!" message
  - Auto-dismiss after delay
  - _Requirements: 13.1, 13.2_

- [x] 7.3 Create WrongModal (3x) component
  - UI matching "tampilan salah lebih dari 3 kali .png"
  - Recommendation message
  - "Lihat Daftar Materi" CTA button
  - Option to continue practicing
  - _Requirements: 14.5, 14.6_

- [x] 7.4 Implement correct answer flow
  - Show CorrectModal with confetti
  - Animate robot climbing
  - Increment floor counter
  - Load next question after 800-1200ms
  - Reset wrongCount
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.7_

- [x] 7.5 Implement wrong answer flow
  - Increment wrongCount
  - Show hint based on wrongCount (1→h1, 2→h2, 3→h3)
  - Show WrongModal if wrongCount >= 3
  - Keep same question until correct
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 7.6 Implement question selection logic
  - Filter by material
  - Difficulty scaling: min(5, 1 + floor/5)
  - Avoid last 10 questions
  - Random selection from pool
  - _Requirements: 13.5, 13.6_

- [x] 7.7 Create EndSessionModal component
  - UI matching "tampilan selamat udah latihan.png"
  - "Selamat, kamu udah berlatih untuk hari ini!"
  - Stats summary (floors, correct answers)
  - "Lihat Progress" CTA
  - Back to dashboard button
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 7.8 Implement "Udah dulu" end flow
  - End practice session
  - Calculate session stats
  - Show EndSessionModal
  - Navigate on CTA clicks
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

---

## Milestone 8: Google Apps Script Backend

- [ ] 8.1 Create Apps Script project structure
  - Code.gs - main entry point
  - Auth.gs - authentication functions
  - Student.gs - student endpoints
  - Teacher.gs - teacher endpoints
  - Utils.gs - utilities (hash, validate, etc.)
  - _Requirements: 17.1_

- [ ] 8.2 Implement spreadsheet schema setup
  - Function to create all sheets with headers
  - Seed data insertion function
  - _Requirements: 17.1, 21.1_

- [ ] 8.3 Implement password hashing
  - SHA-256 with salt using Utilities.computeDigest
  - Salt generation and storage
  - _Requirements: 17.2_

- [ ] 8.4 Implement auth endpoints in Apps Script
  - doPost router for all endpoints
  - Student identify, login, set-password
  - Teacher register, login
  - Token generation and validation
  - _Requirements: 2.*, 3.*_

- [ ] 8.5 Implement teacher endpoints in Apps Script
  - Schools CRUD
  - Classes CRUD
  - Students management
  - _Requirements: 6.*, 7.*_

- [ ] 8.6 Implement student endpoints in Apps Script
  - Get student profile
  - Get materials with progress
  - _Requirements: 10.*, 16.*_

- [ ] 8.7 Implement practice endpoints in Apps Script
  - Start session
  - Answer submission with hint logic
  - End session with stats
  - _Requirements: 11.*, 12.*, 13.*, 14.*, 15.*_

- [ ] 8.8 Create setup documentation
  - docs/setup-google.md
  - Step-by-step Spreadsheet creation
  - Apps Script deployment guide
  - Environment variable configuration
  - _Requirements: Documentation_

---

## Milestone 9: API Integration

- [ ] 9.1 Create API client utility
  - Fetch wrapper with auth header
  - Error handling and parsing
  - Mode detection (mock vs production)
  - _Requirements: 17.3, 18.1_

- [ ] 9.2 Create Next.js API proxy routes
  - /api/[...path] catch-all route
  - Forward to Apps Script URL
  - Handle CORS and errors
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 9.3 Switch mock handlers to use API client
  - Update all components to use unified API client
  - Test with mock mode
  - _Requirements: 17.3_

- [ ] 9.4 Test integration with Apps Script
  - Configure environment variables
  - Test all endpoints
  - Fix any issues
  - _Requirements: 18.*_

---

## Milestone 10: Polish & Launch Prep

- [x] 10.1 Implement responsive design ✅
  - Mobile breakpoints for all student pages
  - Touch-friendly interactions
  - Dynamic viewport height (100dvh)
  - Safe area support for notched devices
  - _Requirements: 20.1, 20.2, 20.3_

- [x] 10.2 Add loading states ✅
  - Button loading spinners
  - Loading indicators on data fetch
  - _Requirements: UX_

- [ ] 10.3 Add error states
  - Error boundaries
  - User-friendly error messages (Indonesian)
  - Retry mechanisms
  - _Requirements: Error Handling_

- [ ] 10.4 Verify all UI matches design PNGs
  - Compare each screen with reference
  - Adjust spacing, colors, typography
  - Fix any discrepancies
  - _Requirements: All UI requirements_

- [x] 10.5 Create seed data for demo ✅
  - Demo accounts available
  - Materials and questions seeded
  - _Requirements: 21.1, 21.2_

- [ ] 10.6 Write README.md
  - Project overview
  - How to run dev
  - How to build
  - Environment variables
  - _Requirements: Documentation_

- [x] 10.7 Game experience polish ✅
  - Wrong answer visual feedback (red flash)
  - Improved robot animations
  - Mobile-optimized game layout
  - Better modal transitions
  - Fixed typo "Udah Ddlu" → "Udah dulu"
  - _Requirements: Game UX_

- [ ] 10.8 Final testing checklist
  - Landing page matches design
  - Student 2-step login works
  - Teacher login/register works
  - Teacher panel: schools, classes, reports
  - Materials list with progress
  - Game: unlimited floors, POV robot
  - Game: correct → confetti + climb
  - Game: wrong → progressive hints
  - Game: 3x wrong → modal
  - Game: "Udah dulu" → end screen
  - Mobile responsive on all pages
  - _Requirements: Acceptance Criteria_

---

## Summary

| Milestone | Tasks | Focus |
|-----------|-------|-------|
| 1 | 8 | Repo setup, tooling, structure |
| 2 | 6 | Base UI components |
| 3 | 7 | Authentication flows |
| 4 | 8 | Teacher panel |
| 5 | 4 | Student materials |
| 6 | 7 | Game core |
| 7 | 8 | Game interactions |
| 8 | 8 | Apps Script backend |
| 9 | 4 | API integration |
| 10 | 7 | Polish & launch |

**Total: 67 tasks**

Estimated time: 40-60 hours for complete implementation
