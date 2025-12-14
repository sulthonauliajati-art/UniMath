# UniMath - Platform Latihan Numerasi Gamified 🤖

Platform web latihan numerasi untuk siswa dengan gamifikasi "naik gedung". Siswa menjawab soal untuk membantu karakter robot naik ke lantai berikutnya (unlimited floors).

![UniMath](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan) ![Database](https://img.shields.io/badge/Database-Turso-green)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Turso account (untuk database)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/unimath.git
cd unimath

# Install dependencies
pnpm install

# Setup environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local dengan credentials kamu

# Push database schema
cd apps/web
pnpm db:push

# Seed database (opsional, untuk data demo)
pnpm db:seed

# Run development server
cd ../..
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy ke Vercel

### Step 1: Setup Database Turso

1. Buat akun di [turso.tech](https://turso.tech)
2. Install Turso CLI:
   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Windows (PowerShell)
   irm https://get.tur.so/install.ps1 | iex
   ```
3. Login dan buat database:
   ```bash
   turso auth login
   turso db create unimath-prod
   turso db show unimath-prod --url    # Copy URL ini
   turso db tokens create unimath-prod  # Copy token ini
   ```

### Step 2: Deploy ke Vercel

1. Push code ke GitHub
2. Buka [vercel.com](https://vercel.com) dan import repository
3. Set **Root Directory** ke `apps/web`
4. Tambahkan Environment Variables:
   | Name | Value |
   |------|-------|
   | `TURSO_DATABASE_URL` | `libsql://unimath-prod-xxx.turso.io` |
   | `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQS...` |
   | `RESEND_API_KEY` | `re_xxx...` (opsional, untuk email) |
5. Click **Deploy**

### Step 3: Setup Database Production

Setelah deploy berhasil:

1. Buka `https://your-app.vercel.app/setup`
2. Buat admin account
3. Login ke `/admin/login`
4. Tambahkan materials dan questions

## 🔑 Demo Accounts (Development)

| Role | Login | Password |
|------|-------|----------|
| Admin | admin@unimath.id | admin123 |
| Teacher | guru@demo.com | demo123 |
| Student | 1234567890 (NISN) | siswa123 |
| Student (new) | 1234567891 (NISN) | *(set password)* |

## 📁 Project Structure

```
unimath/
├── apps/
│   └── web/                 # Next.js 14 App
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   │   ├── student/ # Halaman siswa
│       │   │   ├── teacher/ # Halaman guru
│       │   │   ├── admin/   # Halaman admin
│       │   │   └── api/     # API routes
│       │   ├── components/  # React components
│       │   │   ├── ui/      # UI components
│       │   │   └── game/    # Game components
│       │   ├── lib/         # Utilities
│       │   │   ├── db/      # Database (Drizzle + Turso)
│       │   │   └── auth/    # Authentication
│       │   └── styles/      # Global CSS
│       └── vercel.json      # Vercel config
├── docs/                    # Documentation
└── design/                  # Design references (PNG)
```

## 🎮 Features

### 👨‍🎓 Student Features
- Login 2-step (NISN → Password)
- Dashboard dengan statistik
- Daftar materi dengan progress
- Game "Naik Gedung":
  - Unlimited floors
  - Robot character dengan animasi
  - Confetti saat jawaban benar
  - Hint bertahap (1→2→3) saat salah
  - Modal rekomendasi setelah 3x salah
- Leaderboard
- Achievements & badges
- Profile dengan statistik

### 👩‍🏫 Teacher Features
- Login & Register
- Dashboard dengan statistik
- Kelola sekolah
- Kelola kelas
- Tambah siswa ke kelas
- Lihat laporan siswa
- Reset password siswa
- Export data

### 👨‍💼 Admin Features
- Kelola materials
- Kelola questions (upload CSV)
- Kelola achievements
- Dashboard analytics

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Turso (libSQL) + Drizzle ORM |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Effects | canvas-confetti |
| Email | Resend |
| Deployment | Vercel |

## 🎨 Design System

UI menggunakan glassmorphism style:
- Background: Dark navy (#0a0e27)
- Primary: Cyan (#00d4aa)
- Accent: Teal (#00b4d8)
- Glass cards dengan blur effect
- Animated star particles
- Font: Poppins & Inter

## 📝 Scripts

```bash
# Development
pnpm dev              # Start dev server

# Build
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:push          # Push schema to database
pnpm db:seed          # Seed demo data
pnpm db:studio        # Open Drizzle Studio

# Lint
pnpm lint             # Run ESLint
```

## 🔧 Environment Variables

```env
# Database (Required)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Email (Optional - untuk forgot password)
RESEND_API_KEY=re_xxxx
```

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Development Progress](docs/progress.md)
- [Blueprint](docs/blueprint.md)

## 🤝 Contributing

1. Fork repository
2. Buat branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

MIT License - lihat [LICENSE](LICENSE) untuk detail.

---

Made with ❤️ for Indonesian students
