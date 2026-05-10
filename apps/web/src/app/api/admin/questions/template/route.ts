import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth/utils'

/**
 * GET /api/admin/questions/template
 *
 * Returns a CSV template file with header and 3 example rows that match
 * EXACTLY the validator in /api/admin/questions/upload. The file downloaded
 * here should be re-uploadable without error.
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
    // Still require auth to download (prevents bot scraping).
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
  }

  // IMPORTANT: header and row layout must match the parser/validator in
  // upload/route.ts exactly. Keep them in sync.
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
    'correct',
    'hint1',
    'hint2',
    'hint3',
    'explanation',
    'remedialMaterialId',
  ]

  const rows: string[][] = [
    [
      'PRACTICE',
      'I1',
      'MUDAH',
      'PG',
      '5 + 3 = ?',
      '6',
      '7',
      '8',
      '9',
      'C',
      'Coba hitung dengan jari',
      '5 + 3 berarti 5 ditambah 3',
      'Mulai dari 5 lalu tambah 1 sebanyak 3 kali',
      'Jawabannya adalah 8',
      '',
    ],
    [
      'PRACTICE',
      'I1',
      'SEDANG',
      'PG',
      '12 + 8 = ?',
      '18',
      '19',
      '20',
      '21',
      'C',
      'Pisahkan menjadi puluhan dan satuan',
      '12 = 10 + 2, jadi 10 + 2 + 8',
      '10 + 10 = 20',
      'Hasilnya 20',
      '',
    ],
    [
      'PRETEST',
      'I2',
      'SULIT',
      'PG',
      '45 + 37 = ?',
      '72',
      '82',
      '83',
      '92',
      'B',
      'Jumlahkan satuan dulu',
      '5 + 7 = 12, simpan 2 naik 1',
      '40 + 30 + 12 = 82',
      'Jawaban: 82',
      '',
    ],
  ]

  const escapeCell = (value: string) => {
    // Always quote so Excel/Sheets handle commas/newlines correctly.
    return `"${value.replace(/"/g, '""')}"`
  }

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell ?? '')).join(','))
    .join('\r\n')

  // Prepend UTF-8 BOM so Excel on Windows opens it with proper encoding.
  const body = '\uFEFF' + csv

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="unimath_template_soal.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
