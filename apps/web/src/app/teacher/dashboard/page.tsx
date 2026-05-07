import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { schools, classes, classStudents, teacherProfiles, teacherSchools } from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import TeacherDashboardClient from './TeacherDashboardClient'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboard() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')
  
  if (!userCookie) {
    redirect('/teacher/login')
  }

  let user
  try {
    user = JSON.parse(userCookie.value)
  } catch {
    redirect('/teacher/login')
  }

  if (user.role !== 'TEACHER') {
    redirect('/teacher/login')
  }

  const teacherId = user.id

  // Get teacher profile
  const [profile] = await db
    .select()
    .from(teacherProfiles)
    .where(eq(teacherProfiles.userId, teacherId))
    .limit(1)

  // Get schools owned by this teacher
  const ownedSchools = await db
    .select()
    .from(schools)
    .where(eq(schools.ownerTeacherId, teacherId))

  // Get schools teacher is associated with
  const associatedSchools = await db
    .select({ schoolId: teacherSchools.schoolId })
    .from(teacherSchools)
    .where(eq(teacherSchools.teacherId, teacherId))

  const allSchoolIds = [
    ...ownedSchools.map((s) => s.id),
    ...associatedSchools.map((s) => s.schoolId),
  ]
  const uniqueSchoolIds = Array.from(new Set(allSchoolIds))

  // Get classes in these schools
  let totalClasses = 0
  let totalStudents = 0
  let classIds: string[] = []

  if (uniqueSchoolIds.length > 0) {
    const teacherClasses = await db
      .select()
      .from(classes)
      .where(inArray(classes.schoolId, uniqueSchoolIds))

    totalClasses = teacherClasses.length
    classIds = teacherClasses.map((c) => c.id)

    // Get total students in these classes
    if (classIds.length > 0) {
      const [studentCount] = await db
        .select({ count: sql<number>`count(DISTINCT student_user_id)` })
        .from(classStudents)
        .where(inArray(classStudents.classId, classIds))

      totalStudents = studentCount?.count || 0
    }
  }

  const stats = {
    totalStudents,
    totalClasses,
    totalSchools: uniqueSchoolIds.length,
    points: profile?.points || 0,
  }

  return <TeacherDashboardClient stats={stats} />
}
