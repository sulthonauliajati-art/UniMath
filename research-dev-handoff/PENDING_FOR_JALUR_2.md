# Prioritas & Target "Jalur 2" (Aspek Akademik & Visual)

Fondasi teknis (*database, parser, auth, timer, route protection, export*) sudah disapu bersih pada **Jalur 1**. 

Saat ini, aplikasi sudah stabil secara mesin, dan fokus kerja (*Jalur 2*) mutlak diabadikan untuk memasukkan **muatan akademik** (isi) dan **poles UI** (visual) agar layak dicobakan langsung ke siswa.

## Yang Harus Disiapkan Oleh Peneliti / Klien (Anda)
1. **Penyusunan Teks Materi (Bacaan Utama)**:
   - Draf teks, gambar, atau *link* video untuk materi-materi skripsi (misal: "Untung, Rugi", "Diskon").
2. **Pengisian *Template* CSV Soal secara Nyata**:
   - Menyiapkan soal-soal Latihan yang dilengkap dengan *Hint 1*, *Hint 2* edukatif.
   - Menyiapkan set Pretest dan Posttest yang valid secara instrumen akademis.
3. **Mekanika Penilaian Uraian**:
   - Karena server tidak bisa membaca pikiran benar/salah jawaban paragraf (teks), Anda akan perlu memikirkan rubrik pemberian nilainya secara manual saat Anda mendownload CSV hasil riset.

## Yang Akan Dikerjakan Oleh *Developer* (AI) di Jalur 2
1. **Mempercantik Halaman Utama & Dasbor**: 
   - Supaya nuansa pendidikan lebih hidup (ilustrasi modern).
2. **Menghidupkan Gamifikasi Latihan**:
   - Memastikan saat siswa menjawab soal Latihan, visual "robot naik gedung", koin, animasi getar saat salah, benar-benar menyala.
3. **Membangun Layar Remedial Interaktif**:
   - Mengganti tampilan *blank* dengan kanvas menarik *"Wah, sepertinya kamu kesulitan, yuk baca ini sebentar"* sebelum siswa kembali diizinkan mengerjakan latihan.
4. **Dasbor Guru & Koreksi Uraian (Opsional)**:
   - Membuat panel khusus agar Anda (Admin/Guru) dapat menekan tombol untuk mengunduh rekap CSV, serta membaca secara berurutan jawaban uraian siswa untuk memberi centang manual.
