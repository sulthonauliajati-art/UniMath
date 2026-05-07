import { db } from '@/lib/db/client'
import { users, teacherProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import AdminUsersClient from './AdminUsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const teachers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      points: teacherProfiles.points,
    })
    .from(users)
    .leftJoin(teacherProfiles, eq(teacherProfiles.userId, users.id))
    .where(eq(users.role, 'TEACHER'))

  const students = await db
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

  return <AdminUsersClient teachers={teachers} students={students} />
}
