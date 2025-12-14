import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, classStudents } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params
    const { nisn, name, existingStudentId } = await request.json()

    if (!nisn) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'NISN diperlukan' } },
        { status: 400 }
      )
    }

    // Jika ada existingStudentId, langsung tambahkan ke kelas
    if (existingStudentId) {
      // Check if already in this class
      const [alreadyInClass] = await db
        .select()
        .from(classStudents)
        .where(
          and(
            eq(classStudents.classId, classId),
            eq(classStudents.studentUserId, existingStudentId)
          )
        )
        .limit(1)

      if (alreadyInClass) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE', message: 'Siswa sudah ada di kelas ini' } },
          { status: 409 }
        )
      }

      // Get student data
      const [student] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingStudentId))
        .limit(1)

      if (!student) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
          { status: 404 }
        )
      }

      // Add to class
      await db.insert(classStudents).values({
        classId,
        studentUserId: existingStudentId,
      })

      return NextResponse.json({ student })
    }

    // Cek apakah NISN sudah ada
    const [existingStudent] = await db
      .select()
      .from(users)
      .where(and(eq(users.nisn, nisn), eq(users.role, 'STUDENT')))
      .limit(1)

    if (existingStudent) {
      // Check if already in this class
      const [alreadyInClass] = await db
        .select()
        .from(classStudents)
        .where(
          and(
            eq(classStudents.classId, classId),
            eq(classStudents.studentUserId, existingStudent.id)
          )
        )
        .limit(1)

      if (alreadyInClass) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE', message: 'Siswa sudah ada di kelas ini' } },
          { status: 409 }
        )
      }

      // Add existing student to class
      await db.insert(classStudents).values({
        classId,
        studentUserId: existingStudent.id,
      })

      return NextResponse.json({ student: existingStudent })
    }

    // Buat siswa baru - nama wajib untuk siswa baru
    if (!name) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Nama diperlukan untuk siswa baru' } },
        { status: 400 }
      )
    }

    const newStudentId = `ST${Date.now().toString(36).toUpperCase()}`
    const newStudent = {
      id: newStudentId,
      role: 'STUDENT' as const,
      nisn,
      name,
      passwordStatus: 'UNSET' as const,
      createdAt: new Date().toISOString(),
    }

    await db.insert(users).values(newStudent)
    await db.insert(classStudents).values({
      classId,
      studentUserId: newStudentId,
    })

    return NextResponse.json({ student: newStudent })
  } catch (error) {
    console.error('Add student error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}


// DELETE - Remove student from class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params
    const { studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Student ID diperlukan' } },
        { status: 400 }
      )
    }

    // Check if student is in this class
    const [record] = await db
      .select()
      .from(classStudents)
      .where(
        and(eq(classStudents.classId, classId), eq(classStudents.studentUserId, studentId))
      )
      .limit(1)

    if (!record) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan di kelas ini' } },
        { status: 404 }
      )
    }

    // Remove from class
    await db
      .delete(classStudents)
      .where(
        and(eq(classStudents.classId, classId), eq(classStudents.studentUserId, studentId))
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove student error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    )
  }
}
