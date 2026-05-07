# Handoff Teknis UniMath (Mode Penelitian)

## Ringkasan Proyek
- **Nama Aplikasi**: UniMath
- **Tujuan Sistem**: Platform media pembelajaran interaktif berbasis web yang juga berfungsi sebagai instrumen pengumpulan data penelitian S1 (Pendidikan Matematika).
- **Role Utama**: 
  - **Admin**: Manajemen bank soal dan data master.
  - **Guru**: Pembuatan kelas, pemantauan analitik kemampuan numerik siswa.
  - **Siswa**: Subjek penelitian; mengerjakan modul pembelajaran, tes, dan latihan.

## Pemisahan Mode (Validitas Penelitian)
Demi menjaga validitas data penelitian, lingkungan aplikasi dipisah menjadi dua:
1. **Practice Mode (Latihan Gamified)**:
   - Digunakan sebagai media intervensi/belajar.
   - Penuh gamifikasi (robot, lantai gedung, koin, *streak*).
   - Menggunakan *Adaptive Difficulty* (salah 1x = Hint 1, salah 2x = Hint 2, salah 3x = Tahan/Remedial).
2. **Test Mode (Instrumen Pretest/Posttest)**:
   - Digunakan untuk pengambilan nilai murni (kemampuan awal & akhir).
   - Lingkungan steril: tidak ada gamifikasi, tidak ada tombol hint, tidak ada *feedback* benar/salah.
   - Dilengkapi *Timer* 60 menit anti-curang (bersumber dari *database server*).

## Status Teknis (Penyelesaian Jalur 1)
Infrastruktur *backend* dan perlindungan sistem ("Jalur 1") telah selesai 100%. Data *persistence* aman, pemisahan mode mutlak berhasil, dan fitur ekspor data penelitian CSV telah tersedia.

## Daftar File yang Perlu Dibaca Lebih Dulu
Untuk melakukan audit penelitian, disarankan membaca file berikut secara berurutan:
1. `ARCHITECTURE_SUMMARY.md` - Memahami alur kerja sistem.
2. `QUESTION_BANK_SPEC.md` - Spesifikasi format pengunggahan soal.
3. `DATABASE_SCHEMA_SUMMARY.md` - Melihat struktur data yang disimpan.
4. Folder `code-snapshots/` - Untuk melihat cuplikan logika program.
