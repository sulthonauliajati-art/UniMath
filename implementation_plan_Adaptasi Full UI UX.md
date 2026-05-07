# Adaptasi Full UI/UX Desain Final UniMath

Proyek ini bertujuan untuk mengadaptasi secara sempurna seluruh desain final visual yang berada di `D:\UniMath\design` ke dalam *frontend* aplikasi web UniMath saat ini. Tema utama yang dipertahankan adalah gaya futuristik "neon dark navy/cyan", elemen glassmorphism, maskot robot, dan ilusi visual progres *tower/staircase* (naik lantai) dalam mode latihan.

## User Review Required

> [!WARNING]
> **Asset Gambar (Robot & Background)**
> Di dalam mockup desain, terdapat gambar background gedung, efek kosmik/bintang, dan maskot robot dalam berbagai pose (senang, sedih, dll). 
> **Pertanyaan Penting:** Apakah Anda sudah memotong (export) gambar-gambar *asset* mandiri tersebut (misalnya `robot-happy.png`, `bg-tower.jpg`) dan menyimpannya di folder `public`? Jika belum, saya perlu melakukan ekstraksi dari desain atau menggunakan *placeholder* yang mirip sementara sampai Anda memasukkan *asset* final. Mohon konfirmasinya.

> [!IMPORTANT]
> **Skala Prioritas**
> Mengingat skala perubahan yang masif, saya akan mengimplementasikan ini secara bertahap untuk menjaga stabilitas *backend* dan *logic*:
> 1. Sistem Desain Global (CSS, Komponen Dasar)
> 2. Landing Page & Flow Latihan Siswa (Prioritas Utama)
> 3. Halaman Dashboard & Profil Siswa
> 4. Halaman Dashboard & Kelas Guru

## Proposed Changes

---

### 1. Design System & Global Styles
Memperbarui sistem gaya global agar persis dengan palet dan tipografi final.

#### [MODIFY] `src/styles/globals.css`
- Menyesuaikan nilai variabel warna (`--bg-primary`, `--primary`, `--accent`) agar 100% *matching* dengan hex color di mockup.
- Menambahkan *utility class* baru untuk tombol *outline* dengan *glow* neon.
- Menyempurnakan efek `glass` dan `glow-border` agar bayangannya lebih *soft* dan *premium*.
- Memastikan responsivitas (mobile-first) tidak merusak komposisi *glass card*.

#### [MODIFY] `tailwind.config.ts` (jika ada) / `src/components/ui/*`
- Membuat/memperbarui *reusable components* (Button, Card, TopBar) agar konsisten di seluruh aplikasi sesuai desain.

---

### 2. Auth & Landing Page
Menyesuaikan halaman awal dengan komposisi vertikal yang kuat dan *call-to-action* login yang elegan.

#### [MODIFY] `src/app/page.tsx`
- Implementasi desain `halaman pilihan sebelum login.png`.
- Mengubah background menjadi *tower* bercahaya dengan maskot robot menyapa di bagian bawah tangga.
- *Glass card* di tengah dengan ucapan "Selamat Datang" dan pilihan "Login Siswa" & "Login Guru".

---

### 3. Student Practice Flow (Prioritas Utama)
Mengubah keseluruhan pengalaman latihan agar sensasi "naik lantai" benar-benar terasa secara imersif.

#### [MODIFY] `src/app/student/practice/[materialId]/start/page.tsx`
- Implementasi desain `setelah klik tombol latihan.png`.
- Menambahkan CTA "Mulai Latihan", "Pre-test", dan "Post-test" yang sesuai dengan desain UI baru.

#### [MODIFY] `src/app/student/practice/[materialId]/play/page.tsx`
- Implementasi desain `tampilan soal latihan siswa.png` (state normal).
- Implementasi desain `jawaban ketika salah.png` (warning box oranye, opsi soal terkunci merah).
- Implementasi desain `tampilan salah lebih dari 3 kali .png` (panel remedial, ilustrasi robot sedih).
- Implementasi desain `tampilan jawaban siswa benar.png` (success banner, XP glow, dan animasi naik tangga).
- **Logika UI:** Background dan pijakan tangga akan diberi *styling* dinamis untuk mensimulasikan progresi lantai tanpa merusak fungsi validasi jawaban.

#### [MODIFY] `src/app/student/practice/complete/page.tsx`
- Implementasi desain `tampilan selamat udah latihan.png`.
- Menampilkan ringkasan XP, Akurasi, dan Lantai yang dicapai di dalam 3 kotak kartu yang rapi.

---

### 4. Student Dashboard & Profile
Penyesuaian UI daftar materi dan profil agar senada dengan nuansa neon-glass.

#### [MODIFY] `src/app/student/materials/page.tsx`
- Implementasi desain `list materi.png`.
- Card materi dengan *icon* spesifik, *progress bar* neon cyan, dan robot pemberi semangat di *bottom banner*.

#### [MODIFY] `src/app/student/profile/page.tsx`
- Implementasi desain `profile siswa.png`.
- Menyusun hirarki visual: Avatar, Statistik Utama, Progress per Materi (bar vertikal/horizontal), dan Pencapaian (Badges).

---

### 5. Teacher Area
Memastikan UI dashboard guru sama premiumnya dengan pengalaman siswa.

#### [MODIFY] `src/app/teacher/dashboard/page.tsx`
- Implementasi desain `dashboard selamat datang guru.png`.
- Menyesuaikan layout *metric cards* dan background akademi/gedung pusat.

#### [MODIFY] `src/app/teacher/classes/page.tsx` & `src/app/teacher/classes/[id]/page.tsx`
- Implementasi desain `Daftar Kelas Guru.png` dan `rincian kelas.png`.
- Card kelas berbentuk ilustrasi lantai server/gedung mini sesuai mockup. List siswa diatur dalam *row card* dengan *progress bar* terintegrasi.

#### [MODIFY] `src/app/teacher/profile/page.tsx`
- Implementasi desain `profile guru.png`.
- Menyempurnakan layout informasi sekolah, metrik kinerja guru, dan tombol kontak hubungi guru.

## Verification Plan

### Automated Tests
- Menjalankan `npx next build` untuk memastikan tidak ada *type errors* akibat perubahan struktur komponen UI.

### Manual Verification
1. Mengakses rute sebagai "Guest" (Landing page).
2. Mengakses rute sebagai "Siswa" -> mencoba latihan, memastikan simulasi salah, remedial, dan benar bekerja sempurna dengan UI baru.
3. Mengakses rute sebagai "Guru" -> memeriksa apakah semua data dari *database* tetap ter-render sempurna di dalam desain baru.
4. Uji coba mode layar kecil (mobile responsiveness) untuk memastikan *glassmorphism* dan *layout* tidak pecah.
