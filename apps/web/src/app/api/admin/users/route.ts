import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users, teacherProfiles, practiceSessions, practiceAttempts } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { hashPassword, validateToken, revokeAllUserTokens } from '@/lib/auth/utils'

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const t = await validateToken(token)
  if (!t.valid || t.role !== 'ADMIN') return null
  return t
}

function generateTempPassword(): string {
  // Readable temp password — avoids confusing chars.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

/**
 * GET — list all teachers + students
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const teachers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        passwordStatus: users.passwordStatus,
        points: teacherProfiles.points,
      })
      .from(users)
      .leftJoin(teacherProfiles, eq(teacherProfiles.userId, users.id))
      .where(eq(users.role, 'TEACHER'))

    const studentsRaw = await db
      .select({
        id: users.id,
        name: users.name,
        nisn: users.nisn,
        totalPoints: users.totalPoints,
        passwordStatus: users.passwordStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, 'STUDENT'))

    // ✅ FIX #14: Ambil statistik latihan per siswa
    const students = await Promise.all(
      studentsRaw.map(async (s) => {
        const [sessionStats] = await db
          .select({
            totalSessions: sql<number>`COUNT(DISTINCT ${practiceSessions.id})`,
            highestFloor: sql<number>`COALESCE(MAX(${practiceSessions.floor}), 0)`,
            lastPracticeAt: sql<string>`MAX(${practiceSessions.startedAt})`,
          })
          .from(practiceSessions)
          .where(eq(practiceSessions.studentUserId, s.id))

        const [attemptStats] = await db
          .select({
            totalAttempts: sql<number>`COUNT(*)`,
            correctAttempts: sql<number>`COALESCE(SUM(CASE WHEN ${practiceAttempts.isCorrect} = 1 THEN 1 ELSE 0 END), 0)`,
          })
          .from(practiceAttempts)
          .innerJoin(practiceSessions, eq(practiceAttempts.sessionId, practiceSessions.id))
          .where(eq(practiceSessions.studentUserId, s.id))

        const total = attemptStats?.totalAttempts || 0
        const correct = attemptStats?.correctAttempts || 0
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

        return {
          ...s,
          totalSessions: sessionStats?.totalSessions || 0,
          highestFloor: sessionStats?.highestFloor || 0,
          accuracy,
          totalAttempts: total,
          lastPracticeAt: sessionStats?.lastPracticeAt || null,
        }
      })
    )

    return NextResponse.json({ teachers, students })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

/**
 * POST — create a new teacher or student
 * Body: { role: 'TEACHER' | 'STUDENT', name, email? (teacher), nisn? (student), password? }
 * If password is omitted, a temporary password is generated and returned once.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const body = await request.json()
    const role = String(body.role || '').toUpperCase() as 'TEACHER' | 'STUDENT'

    if (role !== 'TEACHER' && role !== 'STUDENT') {
      return NextResponse.json(
        { error: { message: 'Role harus TEACHER atau STUDENT' } },
        { status: 400 }
      )
    }

    const name = String(body.name || '').trim()
    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: { message: 'Nama wajib diisi (minimal 3 karakter)' } },
        { status: 400 }
      )
    }

    let tempPasswordGenerated: string | null = null
    let rawPassword = String(body.password || '')
    if (!rawPassword) {
      tempPasswordGenerated = generateTempPassword()
      rawPassword = tempPasswordGenerated
    }
    if (rawPassword.length < 6) {
      return NextResponse.json(
        { error: { message: 'Password minimal 6 karakter' } },
        { status: 400 }
      )
    }

    if (role === 'TEACHER') {
      const email = String(body.email || '').trim().toLowerCase()
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: { message: 'Email guru tidak valid' } },
          { status: 400 }
        )
      }
      const [existing] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.role, 'TEACHER')))
        .limit(1)
      if (existing) {
        return NextResponse.json(
          { error: { message: 'Email guru sudah terdaftar' } },
          { status: 409 }
        )
      }

      const newId = `T${Date.now().toString(36).toUpperCase()}`
      const hashed = await hashPassword(rawPassword)
      await db.insert(users).values({
        id: newId,
        role: 'TEACHER',
        name,
        email,
        password: hashed,
        passwordStatus: 'SET',
        createdAt: new Date().toISOString(),
      })
      await db.insert(teacherProfiles).values({
        userId: newId,
        displayName: name,
        points: 0,
      })

      return NextResponse.json({
        success: true,
        id: newId,
        tempPassword: tempPasswordGenerated,
      })
    }

    // STUDENT
    const nisn = String(body.nisn || '').trim()
    if (!nisn || !/^\d+$/.test(nisn)) {
      return NextResponse.json(
        { error: { message: 'NISN siswa wajib berupa angka' } },
        { status: 400 }
      )
    }
    const [existingSt] = await db
      .select()
      .from(users)
      .where(and(eq(users.nisn, nisn), eq(users.role, 'STUDENT')))
      .limit(1)
    if (existingSt) {
      return NextResponse.json({ error: { message: 'NISN sudah terdaftar' } }, { status: 409 })
    }

    const newId = `ST${Date.now().toString(36).toUpperCase()}`
    const hashed = await hashPassword(rawPassword)
    await db.insert(users).values({
      id: newId,
      role: 'STUDENT',
      name,
      nisn,
      password: hashed,
      passwordStatus: 'SET',
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      id: newId,
      tempPassword: tempPasswordGenerated,
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

/**
 * PATCH — update name/email/nisn OR reset password.
 * Body: { id, name?, email?, nisn?, resetPassword?: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const body = await request.json()
    const id = String(body.id || '').trim()
    if (!id) {
      return NextResponse.json({ error: { message: 'User ID diperlukan' } }, { status: 400 })
    }

    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!existing) {
      return NextResponse.json({ error: { message: 'User tidak ditemukan' } }, { status: 404 })
    }

    // Protect admins from being modified here
    if (existing.role === 'ADMIN') {
      return NextResponse.json({ error: { message: 'Tidak boleh mengubah admin' } }, { status: 403 })
    }

    const updates: Partial<typeof users.$inferInsert> = {}

    if (body.name) {
      const name = String(body.name).trim()
      if (name.length < 3) {
        return NextResponse.json(
          { error: { message: 'Nama minimal 3 karakter' } },
          { status: 400 }
        )
      }
      updates.name = name
    }

    if (existing.role === 'TEACHER' && body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: { message: 'Format email tidak valid' } }, { status: 400 })
      }
      if (email !== existing.email) {
        const [dup] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, email), eq(users.role, 'TEACHER')))
          .limit(1)
        if (dup) {
          return NextResponse.json({ error: { message: 'Email sudah dipakai' } }, { status: 409 })
        }
      }
      updates.email = email
    }

    if (existing.role === 'STUDENT' && body.nisn !== undefined) {
      const nisn = String(body.nisn).trim()
      if (!/^\d+$/.test(nisn)) {
        return NextResponse.json({ error: { message: 'NISN harus angka' } }, { status: 400 })
      }
      if (nisn !== existing.nisn) {
        const [dup] = await db
          .select()
          .from(users)
          .where(and(eq(users.nisn, nisn), eq(users.role, 'STUDENT')))
          .limit(1)
        if (dup) {
          return NextResponse.json({ error: { message: 'NISN sudah dipakai' } }, { status: 409 })
        }
      }
      updates.nisn = nisn
    }

    let tempPassword: string | null = null
    if (body.resetPassword === true) {
      tempPassword = generateTempPassword()
      updates.password = await hashPassword(tempPassword)
      updates.passwordStatus = 'SET'
      // Invalidate any active sessions for security
      await revokeAllUserTokens(id)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { message: 'Tidak ada perubahan yang dikirim' } },
        { status: 400 }
      )
    }

    await db.update(users).set(updates).where(eq(users.id, id))

    // Sync teacherProfiles.displayName when teacher name is updated
    if (updates.name && existing.role === 'TEACHER') {
      await db
        .update(teacherProfiles)
        .set({ displayName: updates.name })
        .where(eq(teacherProfiles.userId, id))
    }

    return NextResponse.json({ success: true, tempPassword })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}

/**
 * DELETE — hard delete only when no dependents; otherwise advise deactivation.
 * Body: { id }
 *
 * Note: Hard delete of users with practice sessions/class memberships will
 * fail due to FK; we return a clear error message. For safer production we
 * would use a soft delete (isActive), but schema doesn't have that column.
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const body = await request.json()
    const id = String(body.id || '').trim()
    if (!id) {
      return NextResponse.json({ error: { message: 'User ID diperlukan' } }, { status: 400 })
    }

    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!existing) {
      return NextResponse.json({ error: { message: 'User tidak ditemukan' } }, { status: 404 })
    }
    if (existing.role === 'ADMIN') {
      return NextResponse.json({ error: { message: 'Tidak boleh menghapus admin' } }, { status: 403 })
    }

    try {
      // Remove profile first if teacher
      if (existing.role === 'TEACHER') {
        await db.delete(teacherProfiles).where(eq(teacherProfiles.userId, id))
      }
      // Revoke tokens
      await revokeAllUserTokens(id)
      // Finally delete the user (may fail due to FK — caught below)
      await db.delete(users).where(eq(users.id, id))
      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('Hard delete failed (likely FK constraint):', err)
      return NextResponse.json(
        {
          error: {
            message:
              'User ini terhubung ke data latihan/kelas. Aktifkan soft-delete atau hapus data terkait terlebih dahulu.',
          },
        },
        { status: 409 }
      )
    }
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: { message: 'Server error' } }, { status: 500 })
  }
}
