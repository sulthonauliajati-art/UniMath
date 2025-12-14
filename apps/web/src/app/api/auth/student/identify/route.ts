import { NextRequest, NextResponse } from 'next/server'
import { mockStudents } from '@/data/mock/seed'

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json()

    if (!identifier) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Identifier diperlukan' } },
        { status: 400 }
      )
    }

    // Search by NISN or name (case-insensitive)
    const student = mockStudents.find(
      (s) =>
        s.nisn === identifier ||
        s.name.toLowerCase() === identifier.toLowerCase()
    )

    if (student) {
      return NextResponse.json({
        exists: true,
        user: {
          id: student.id,
          name: student.name,
          nisn: student.nisn,
          passwordStatus: student.passwordStatus,
        },
      })
    }

    return NextResponse.json({ exists: false })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
