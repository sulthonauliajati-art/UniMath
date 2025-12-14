# Requirements Document

## Introduction

UniMath adalah web application platform latihan numerasi gamified untuk siswa dengan konsep "naik gedung". Siswa menjawab soal untuk membantu karakter robot naik ke lantai berikutnya (unlimited floors). Guru mengelola sekolah, kelas, dan melihat rekap siswa. Materi dan bank soal disediakan oleh sistem.

Target: MVP siap demo/launch dengan fitur lengkap sesuai 13 desain PNG referensi.

## Glossary

- **UniMath System**: Platform web application latihan numerasi gamified
- **Student**: Pengguna siswa yang mengerjakan latihan soal
- **Teacher**: Pengguna guru yang mengelola sekolah, kelas, dan melihat rekap siswa
- **NISN**: Nomor Induk Siswa Nasional, identifier unik siswa
- **Floor**: Level/lantai dalam game naik gedung, dimulai dari 1 dan unlimited
- **Practice Session**: Sesi latihan siswa yang mencatat progress floor dan jawaban
- **Hint**: Petunjuk yang muncul bertahap saat siswa menjawab salah (hint1, hint2, hint3)
- **Wrong Count**: Jumlah jawaban salah pada floor/soal yang sama dalam satu sesi
- **Material**: Materi pembelajaran yang disediakan sistem (bukan dikelola guru)
- **Question Bank**: Kumpulan soal yang disediakan sistem per materi
- **Glassmorphism**: Style UI dengan efek blur, opacity, dan border neon
- **POV Robot**: Tampilan game dari sudut pandang orang kedua, robot terlihat dari belakang

## Requirements

### Requirement 1: Landing Page

**User Story:** As a user, I want to see a landing page with login options, so that I can choose to login as student or teacher.

#### Acceptance Criteria

1. WHEN a user visits the root URL THEN the UniMath System SHALL display a landing page with two distinct login options: "Login Siswa" and "Login Guru"
2. WHEN a user clicks "Login Siswa" THEN the UniMath System SHALL navigate to the student login page
3. WHEN a user clicks "Login Guru" THEN the UniMath System SHALL navigate to the teacher login page
4. WHEN the landing page loads THEN the UniMath System SHALL display UI matching the design reference "halaman pilihan sebelum login.png" with glassmorphism style and neon accents

### Requirement 2: Student Authentication (2-Step Login)

**User Story:** As a student, I want to login using my NISN or name with a 2-step process, so that I can securely access my learning materials.

#### Acceptance Criteria

1. WHEN a student visits the login page THEN the UniMath System SHALL display only one input field for "Nama / NISN"
2. WHEN a student submits a valid NISN or name that exists in the database THEN the UniMath System SHALL display a password input field and "Lupa password" button
3. WHEN a student submits a NISN or name that does not exist in the database THEN the UniMath System SHALL display "Akun tidak ditemukan / belum aktif" message with instruction to contact teacher
4. WHEN a student record exists with password_status = UNSET THEN the UniMath System SHALL display a "Buat Password" form with password and confirm password fields
5. WHEN a student successfully sets a new password THEN the UniMath System SHALL automatically log the student in and redirect to dashboard
6. WHEN a student enters correct password THEN the UniMath System SHALL create an auth token and redirect to student dashboard
7. WHEN a student enters incorrect password THEN the UniMath System SHALL display an error message and allow retry
8. WHEN a student clicks "Lupa password" THEN the UniMath System SHALL display a message to contact teacher for password reset

### Requirement 3: Teacher Authentication

**User Story:** As a teacher, I want to register and login to the system, so that I can manage my schools, classes, and view student reports.

#### Acceptance Criteria

1. WHEN a teacher visits the login page THEN the UniMath System SHALL display tabs or buttons for "Login" and "Daftar"
2. WHEN a teacher fills the registration form with name, email, and password THEN the UniMath System SHALL create a new teacher account
3. WHEN a teacher enters valid email and password THEN the UniMath System SHALL create an auth token and redirect to teacher dashboard
4. WHEN a teacher enters invalid credentials THEN the UniMath System SHALL display an error message
5. WHEN registration email already exists THEN the UniMath System SHALL display "Email sudah terdaftar" error

### Requirement 4: Route Protection and Session Management

**User Story:** As a system administrator, I want routes to be protected based on authentication, so that unauthorized users cannot access protected pages.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses any /student/* route THEN the UniMath System SHALL redirect to /student/login
2. WHEN an unauthenticated user accesses any /teacher/* route THEN the UniMath System SHALL redirect to /teacher/login
3. WHEN a user clicks logout THEN the UniMath System SHALL delete the auth token and redirect to the appropriate login page
4. WHEN an auth token expires THEN the UniMath System SHALL redirect to login page on next protected route access

### Requirement 5: Teacher Dashboard

**User Story:** As a teacher, I want to see a dashboard with my statistics and quick actions, so that I can efficiently manage my teaching activities.

#### Acceptance Criteria

1. WHEN a teacher logs in THEN the UniMath System SHALL display a dashboard matching "dashboard selamat datang guru.png" design
2. WHEN the dashboard loads THEN the UniMath System SHALL display teacher's name, total students, total classes, and activity statistics
3. WHEN the dashboard loads THEN the UniMath System SHALL display a sidebar menu with only three items: "Kelola Sekolah", "Kelola Kelas", "Rekap & Laporan Siswa"

### Requirement 6: Teacher School Management

**User Story:** As a teacher, I want to create and manage schools, so that I can organize my classes under schools.

#### Acceptance Criteria

1. WHEN a teacher accesses school management THEN the UniMath System SHALL display a list of schools owned by the teacher
2. WHEN a teacher creates a new school with a name THEN the UniMath System SHALL save the school and display it in the list
3. WHEN a teacher views school details THEN the UniMath System SHALL display school name and associated classes

### Requirement 7: Teacher Class Management

**User Story:** As a teacher, I want to create classes and add students, so that I can organize students for learning.

#### Acceptance Criteria

1. WHEN a teacher accesses class management THEN the UniMath System SHALL display a list of classes matching "Daftar Kelas Guru.png" design
2. WHEN a teacher creates a new class with school, name, and grade THEN the UniMath System SHALL save the class and display it in the list
3. WHEN a teacher views class details THEN the UniMath System SHALL display class info and student list matching "rincian kelas.png" design
4. WHEN a teacher adds a student with NISN and name THEN the UniMath System SHALL create a student record with password_status = UNSET
5. WHEN a teacher clicks on a student THEN the UniMath System SHALL navigate to student detail report

### Requirement 8: Student Report View

**User Story:** As a teacher, I want to view detailed student reports, so that I can track individual student progress.

#### Acceptance Criteria

1. WHEN a teacher views student detail THEN the UniMath System SHALL display student profile and statistics matching "profile siswa.png" design
2. WHEN viewing student report THEN the UniMath System SHALL display total floors reached, practice sessions, and accuracy statistics
3. WHEN viewing student report THEN the UniMath System SHALL display progress per material

### Requirement 9: Teacher Profile

**User Story:** As a teacher, I want to view and manage my profile, so that I can see my statistics and update my information.

#### Acceptance Criteria

1. WHEN a teacher accesses profile THEN the UniMath System SHALL display profile matching "profile guru.png" design
2. WHEN viewing profile THEN the UniMath System SHALL display teacher name, email, total students, total classes, and points

### Requirement 10: Student Materials List

**User Story:** As a student, I want to see a list of learning materials with my progress, so that I can choose what to study.

#### Acceptance Criteria

1. WHEN a student accesses materials page THEN the UniMath System SHALL display material cards matching "list materi.png" design
2. WHEN displaying material card THEN the UniMath System SHALL show title, progress bar, and buttons for "Ringkasan", "Lengkap", "Video / Catatan Lengkap"
3. WHEN displaying progress THEN the UniMath System SHALL calculate progress based on practice attempts and correct answers for that material
4. WHEN a student clicks "Mulai Latihan" on a material THEN the UniMath System SHALL navigate to practice start screen

### Requirement 11: Practice Start Screen

**User Story:** As a student, I want to see a start screen before practice, so that I can prepare and choose practice mode.

#### Acceptance Criteria

1. WHEN a student accesses practice start THEN the UniMath System SHALL display UI matching "setelah klik tombol latihan.png" design
2. WHEN the start screen loads THEN the UniMath System SHALL display a large "Mulai Latihan" button
3. WHEN the start screen loads THEN the UniMath System SHALL display mode toggle for "Pre-test" and "Post-test" (UI only for MVP)
4. WHEN a student clicks "Mulai Latihan" THEN the UniMath System SHALL create a practice session and navigate to game view

### Requirement 12: Game View - Main Interface

**User Story:** As a student, I want to see an engaging game interface while practicing, so that I feel motivated to continue learning.

#### Acceptance Criteria

1. WHEN a student enters game view THEN the UniMath System SHALL display UI matching "tampilan soal latihan siswa.png" design
2. WHEN displaying floor THEN the UniMath System SHALL show only "Lantai X" without total floors (unlimited concept)
3. WHEN displaying game view THEN the UniMath System SHALL show robot character from behind (POV second person) facing stairs/building
4. WHEN displaying question THEN the UniMath System SHALL show 4 answer options as large pill buttons
5. WHEN displaying game view THEN the UniMath System SHALL show "Kirim Jawaban" button and "Udah dulu" button
6. WHEN displaying game view THEN the UniMath System SHALL use dark navy background with star particles, neon streaks, and glassmorphism cards

### Requirement 13: Game View - Correct Answer Behavior

**User Story:** As a student, I want to see celebration when I answer correctly, so that I feel rewarded and motivated.

#### Acceptance Criteria

1. WHEN a student answers correctly THEN the UniMath System SHALL display confetti animation and large checkmark matching "tampilan jawaban siswa benar.png" design
2. WHEN a student answers correctly THEN the UniMath System SHALL display "Naik ke lantai berikutnya!" message
3. WHEN a student answers correctly THEN the UniMath System SHALL animate robot climbing one floor with smooth transition
4. WHEN a student answers correctly THEN the UniMath System SHALL increment floor counter and load next question after 800-1200ms delay
5. WHEN selecting next question THEN the UniMath System SHALL choose from same material with gradually increasing difficulty (difficulty = min(5, 1 + floor/5))
6. WHEN selecting next question THEN the UniMath System SHALL avoid repeating last 10 questions used in the session

### Requirement 14: Game View - Wrong Answer and Hint System

**User Story:** As a student, I want to receive progressive hints when I answer incorrectly, so that I can learn from my mistakes.

#### Acceptance Criteria

1. WHEN a student first views a question THEN the UniMath System SHALL NOT display any hints
2. WHEN a student answers incorrectly once THEN the UniMath System SHALL display Hint 1 matching "jawaban ketika salah.png" design
3. WHEN a student answers incorrectly twice on same floor THEN the UniMath System SHALL display Hint 2
4. WHEN a student answers incorrectly three times on same floor THEN the UniMath System SHALL display Hint 3
5. WHEN a student answers incorrectly three or more times THEN the UniMath System SHALL display modal matching "tampilan salah lebih dari 3 kali .png" design with "Lihat Daftar Materi" CTA
6. WHEN a student clicks "Lihat Daftar Materi" THEN the UniMath System SHALL navigate to /student/materials
7. WHEN a student answers correctly THEN the UniMath System SHALL reset wrong count to 0 for the next floor

### Requirement 15: Practice End Screen

**User Story:** As a student, I want to see a summary when I finish practicing, so that I know my progress for the day.

#### Acceptance Criteria

1. WHEN a student clicks "Udah dulu" THEN the UniMath System SHALL end the practice session and display end screen matching "tampilan selamat udah latihan.png" design
2. WHEN displaying end screen THEN the UniMath System SHALL show "Selamat, kamu udah berlatih untuk hari ini!" message
3. WHEN displaying end screen THEN the UniMath System SHALL show "Lihat Progress" CTA button
4. WHEN displaying end screen THEN the UniMath System SHALL show button to return to dashboard

### Requirement 16: Student Profile and Progress

**User Story:** As a student, I want to view my profile and progress, so that I can track my learning journey.

#### Acceptance Criteria

1. WHEN a student accesses profile THEN the UniMath System SHALL display profile matching "profile siswa.png" design
2. WHEN viewing profile THEN the UniMath System SHALL display name, NISN, total floors reached, and practice statistics

### Requirement 17: Backend Data Storage

**User Story:** As a system administrator, I want data stored in Google Sheets with Apps Script API, so that the system has a simple and accessible backend.

#### Acceptance Criteria

1. WHEN the backend initializes THEN the UniMath System SHALL create or use spreadsheet with tables: users, teachers, schools, classes, class_students, materials, questions, practice_sessions, attempts, auth_tokens
2. WHEN storing passwords THEN the UniMath System SHALL hash passwords using SHA-256 with salt
3. WHEN the system runs without Google credentials THEN the UniMath System SHALL use mock data mode with local JSON data
4. WHEN Google credentials are configured THEN the UniMath System SHALL automatically switch to Apps Script backend

### Requirement 18: API Proxy for CORS

**User Story:** As a developer, I want an API proxy to handle CORS issues, so that the frontend can safely communicate with Apps Script.

#### Acceptance Criteria

1. WHEN frontend makes API calls THEN the UniMath System SHALL route through same-origin proxy to Apps Script
2. WHEN proxy receives request THEN the UniMath System SHALL forward to Apps Script and return response
3. WHEN Apps Script is unavailable THEN the UniMath System SHALL return appropriate error response

### Requirement 19: UI/UX Design System

**User Story:** As a user, I want a consistent and engaging visual experience, so that the application feels polished and enjoyable.

#### Acceptance Criteria

1. WHEN rendering any page THEN the UniMath System SHALL use dark navy background with star particles and neon streaks
2. WHEN rendering cards THEN the UniMath System SHALL use glassmorphism style with blur, opacity, and neon cyan/green borders
3. WHEN rendering buttons THEN the UniMath System SHALL use large rounded buttons with green/cyan gradients and subtle glow
4. WHEN rendering text THEN the UniMath System SHALL use Poppins or Inter font with bold, modern typography
5. WHEN animating UI elements THEN the UniMath System SHALL use smooth, game-feel animations via Framer Motion

### Requirement 20: Responsive Design

**User Story:** As a user, I want the application to work on both mobile and desktop, so that I can access it from any device.

#### Acceptance Criteria

1. WHEN viewing on mobile devices THEN the UniMath System SHALL adapt layout to fit smaller screens
2. WHEN viewing on desktop THEN the UniMath System SHALL utilize larger screen space appropriately
3. WHEN transitioning between breakpoints THEN the UniMath System SHALL maintain usability and visual consistency

### Requirement 21: Seed Data

**User Story:** As a developer, I want seed data available, so that the application can be demonstrated without manual data entry.

#### Acceptance Criteria

1. WHEN mock mode is active THEN the UniMath System SHALL provide seed data with 1 demo teacher, 1 school, 2 classes, multiple students, 3-5 materials, and 30+ questions
2. WHEN demo accounts are used THEN the UniMath System SHALL allow login with predefined credentials
