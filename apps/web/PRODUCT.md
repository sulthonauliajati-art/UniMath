# Product

## Register

product

## Users

**Primary: Siswa SD (grades 4–6).** Anak-anak Indonesia usia 9-12 tahun yang menggunakan platform untuk latihan numerasi. Konteks: di sekolah (jam pelajaran, didampingi guru) atau di rumah (belajar mandiri). Mereka datang untuk berlatih soal, naik level, dan mengumpulkan XP — termotivasi oleh progres visual dan karakter robot.

**Secondary: Guru.** Wali kelas dan guru matematika yang mengelola kelas, memantau progres siswa, dan mengekspor data untuk analisis. Mereka butuh insight cepat tentang indikator numerasi (I1-I4) per siswa.

**Tertiary: Admin.** Pengelola konten yang mengunggah bank soal, mengatur materi, dan mengelola achievements.

## Product Purpose

UniMath adalah platform latihan numerasi gamified untuk penelitian skripsi S1 Pendidikan Matematika. Platform ini menggabungkan latihan soal adaptif dengan metafora "robot naik gedung" untuk membuat latihan numerasi terasa seperti bermain game. Di balik layer gamifikasi, sistem memisahkan secara ketat mode Latihan (gamified, adaptive difficulty, hints) dan mode Tes (steril, no feedback) untuk menjaga validitas data penelitian pretest/posttest.

Success: siswa menyelesaikan sesi latihan dengan engagement tinggi (floor progression, streak, XP), guru mendapatkan data indikator I1-I4 yang valid untuk analisis, dan peneliti memperoleh data pretest/posttest yang tidak terkontaminasi treatment gamifikasi.

## Brand Personality

**Modern, game-like, energik — tapi presisi dan sleek.** Bukan childish atau cartoonish. Bayangkan Duolingo bertemu interface developer tool yang dark-mode: gamifikasi yang satisfying (streak counter, XP pop, floor-up animation) dibungkus dalam estetika glassmorphism dark yang tajam dan bersih.

Tiga kata: **Precise, Energizing, Trustworthy.**

- **Precise**: Typography bersih, spacing konsisten, tidak ada dekorasi berlebihan. Angka dan data ditampilkan dengan jelas. Ini platform edukasi serius, bukan sekadar game.
- **Energizing**: Micro-interactions yang satisfying — confetti saat benar, robot melompat, XP counter naik. Motion cepat dan purposeful (150-250ms), bukan choreography panjang.
- **Trustworthy**: Dark mode memberikan kesan serius dan fokus. Data guru dan admin ditampilkan dengan presisi. Tidak ada trik UI atau dark pattern.

## Anti-references

- **UI kartun / childish** — warna pastel, font bulat comic-style, karakter yang terlalu lucu, ilustrasi berlebihan. Target user adalah anak SD, tapi ini platform belajar serius dengan validitas penelitian.
- **Quizizz / Kahoot chaotic** — warna mencolok, layout ramai, motion berlebihan, musik autoplay. Overstimulasi, bukan fokus.
- **Ruangguru / Zenius textbook-heavy** — terlalu banyak teks, layout padat seperti buku digital, tidak ada gamifikasi yang engaging.
- **SaaS dashboard generik** — card putih, sidebar abu-abu, tabel striped yang membosankan. Glassmorphism dark adalah identitas yang sudah terbangun dan harus dipertahankan.

## Design Principles

1. **Game feel, not game look.** Mekanik gamifikasi (XP, streak, floor, confetti, robot animation) menciptakan engagement, tapi visual tetap sleek dan dewasa. Tidak perlu UI bergaya game untuk memberikan game feel.

2. **Feedback is the reward.** Setiap aksi siswa mendapat respons visual instan dan satisfying: jawaban benar → robot melompat + confetti + XP pop. Jawaban salah → hint bertahap + dorongan untuk mencoba lagi. Tidak ada hukuman, hanya scaffolding.

3. **Separation by mode, not by style.** Mode Latihan dan Tes terpisah secara struktural (route, API, database), bukan hanya secara visual. Tapi keduanya tetap dalam satu design system yang koheren — Tes tidak harus terlihat seperti aplikasi berbeda.

4. **Data with dignity.** Guru dan peneliti melihat data numerasi yang serius. Indikator I1-I4, akurasi per siswa, heatmap kesalahan — ditampilkan dengan presisi dan kejelasan, tanpa dekorasi gamifikasi.

5. **Dark by default, not by trend.** Glassmorphism dark mode adalah pilihan fungsional: mengurangi eye strain untuk sesi latihan panjang, membuat elemen glass/transparan terlihat natural, dan membedakan UniMath dari platform edukasi Indonesia yang mayoritas terang/putih.

## Accessibility & Inclusion

- Target: WCAG 2.1 Level AA
- Kontras teks ≥ 4.5:1 pada body, ≥ 3:1 pada heading besar — kritis pada dark mode di mana teks abu-abu mudah jatuh di bawah threshold
- Semua state interaktif (hover, focus, active, disabled) harus visually distinct — bukan hanya perubahan warna
- Focus ring visible untuk navigasi keyboard (digunakan guru/admin yang power-user)
- `prefers-reduced-motion`: ganti animasi dengan crossfade/instant transition — confetti, robot jump, dan floor transition semuanya harus punya fallback
- Font Poppins + Inter sudah terbaca jelas; pastikan tidak ada teks di bawah 14px untuk readability siswa
- Tidak bergantung pada warna saja untuk menyampaikan informasi (jawaban benar/salah juga menggunakan ikon dan teks, bukan hanya hijau/merah)
