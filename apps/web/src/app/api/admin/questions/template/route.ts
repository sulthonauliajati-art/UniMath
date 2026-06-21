import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth/utils'

/**
 * GET /api/admin/questions/template
 *
 * Returns a CSV template file with header and 3 example rows that match
 * EXACTLY the validator in /api/admin/questions/upload. The file downloaded
 * here should be re-uploadable without error.
 *
 * Format kolom (v2 — dengan optE wajib):
 *   0  mode             PRACTICE | PRETEST | POSTTEST | ALL
 *   1  indicator        I1 | I2 | I3 | I4
 *   2  difficulty       1|2|3 atau MUDAH|SEDANG|SULIT
 *   3  questionType     PG | URAIAN
 *   4  question         teks soal
 *   5  optA             opsi A (wajib PG)
 *   6  optB             opsi B (wajib PG)
 *   7  optC             opsi C (wajib PG)
 *   8  optD             opsi D (wajib PG)
 *   9  optE             opsi E (wajib PG)
 *  10  correct          A|B|C|D|E (wajib PG)
 *  11  hint1            opsional
 *  12  hint2            opsional
 *  13  hint3            opsional
 *  14  explanation      opsional
 *  15  remedialMaterialId opsional
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token) {
    const tokenData = await validateToken(token)
    if (!tokenData.valid || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    }
  } else {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
  }

  // IMPORTANT: header dan urutan kolom harus identik dengan parser di upload/route.ts.
  const header = [
    'mode',
    'indicator',
    'difficulty',
    'questionType',
    'question',
    'optA',
    'optB',
    'optC',
    'optD',
    'optE',       // ← BARU (posisi 9)
    'correct',    // ← geser ke posisi 10
    'hint1',
    'hint2',
    'hint3',
    'explanation',
    'remedialMaterialId',
  ]

  const rows: string[][] = [
    // Contoh 1: 5 opsi (A–E), jawaban E
    [
      'PRACTICE',
      'I1',
      'MUDAH',
      'PG',
      'Diskon 25% dari harga Rp 80.000 adalah?',
      'Rp 15.000',
      'Rp 18.000',
      'Rp 20.000',
      'Rp 22.000',
      'Rp 25.000',   // optE
      'C',           // correct (optC = Rp 20.000)
      'Diskon = % × harga asli',
      '25% = 25/100',
      '25/100 × 80.000 = 20.000',
      'Diskon 25% dari Rp 80.000 = Rp 20.000',
      '',
    ],
    // Contoh 2: 5 opsi, jawaban E
    [
      'PRACTICE',
      'I2',
      'SEDANG',
      'PG',
      'Harga setelah diskon 20% dari Rp 150.000 adalah?',
      'Rp 100.000',
      'Rp 110.000',
      'Rp 120.000',
      'Rp 125.000',
      'Rp 130.000',  // optE
      'C',           // correct (optC = Rp 120.000)
      'Harga akhir = harga asli − diskon',
      'Diskon = 20% × 150.000 = 30.000',
      'Harga akhir = 150.000 − 30.000',
      'Hasilnya Rp 120.000',
      '',
    ],
    // Contoh 3: 5 opsi, jawaban A
    [
      'PRETEST',
      'I3',
      'SULIT',
      'PG',
      'Toko membeli barang seharga Rp 200.000 dan menjual dengan untung 35%. Harga jual adalah?',
      'Rp 270.000',
      'Rp 240.000',
      'Rp 260.000',
      'Rp 280.000',
      'Rp 300.000',  // optE
      'A',           // correct (optA = Rp 270.000)
      'Harga jual = harga beli + untung',
      'Untung = 35% × 200.000 = 70.000',
      'Harga jual = 200.000 + 70.000',
      'Jawaban: Rp 270.000',
      '',
    ],
  ]

  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell ?? '')).join(','))
    .join('\r\n')

  // UTF-8 BOM agar Excel Windows membuka dengan encoding benar
  const body = '\uFEFF' + csv

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="unimath_template_soal_v2.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
