# Ringkasan API Routes (Backend)

Daftar rute *backend* yang melayani fungsionalitas pengumpulan data dan logika adaptif untuk skripsi.

## 1. Practice Routes (Latihan)
| Method | Path | Fungsi & Output Utama |
|---|---|---|
| POST | `/api/practice/start` | Menginisialisasi sesi latihan. Mengembalikan `sessionId` dan soal pertama. |
| GET | `/api/practice/current` | Menarik sesi yang sedang berjalan (`ACTIVE` / `REMEDIAL_REQUIRED`) beserta riwayat soal. |
| POST | `/api/practice/answer` | Mengirim jawaban (`A/B/C/D`). Mengevaluasi *Adaptive Difficulty*. Output: `isCorrect`, `nextQuestion` (jika benar), atau `hint` / instruksi *remedial* (jika salah beruntun). |
| POST | `/api/practice/end` | Mengakhiri sesi secara sukarela, mengalkulasi poin. |

## 2. Test Routes (Strict Mode)
| Method | Path | Fungsi & Output Utama |
|---|---|---|
| POST | `/api/test/start` | Memulai tes (PRETEST/POSTTEST). Mengembalikan array soal utuh (kunci jawaban & hint dihilangkan), `sessionId`, dan `startedAt` (untuk *server timer*). Jika sesi sudah `completedAt`, akses diblokir. |
| POST | `/api/test/answer` | *Autosave* jawaban tes (PG/Uraian). Output murni `{ success: true }`, tidak mengembalikan validasi benar/salah ke *frontend*. |
| POST | `/api/test/finish` | Mengunci paksa sesi dengan mengisi stempel waktu `completedAt`. Sesi tidak dapat dilanjutkan lagi. |

## 3. Admin & Upload Routes
| Method | Path | Fungsi & Output Utama |
|---|---|---|
| POST | `/api/admin/questions/upload` | Mem-parsing dan memvalidasi baris CSV (15 kolom). Input: *FormData file*. Output: Angka soal yang sukses masuk, atau pesan error format per baris. |

## 4. Export & Analytics Routes
| Method | Path | Fungsi & Output Utama |
|---|---|---|
| GET | `/api/admin/export/research?testType=...` | Mengunduh `research_data_XXX.csv` berisi seluruh kolom wajib untuk analisis statistik skripsi (Data Tes). |
| GET | `/api/admin/export/practice` | Mengunduh rekam jejak perilaku siswa di Mode Latihan (termasuk *usedHintLevel*). |

## 5. Essay Review Routes
| Method | Path | Fungsi & Output Utama |
|---|---|---|
| GET | `/api/admin/essays` | Mengambil array JSON jawaban ber-tipe `URAIAN` yang `isCorrect`-nya masih `null`, siap untuk ditarik ke aplikasi eksternal atau UI Koreksi Guru. |
