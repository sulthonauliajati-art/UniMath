const API_BASE = '/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An error occurred',
      response.status,
      data
    )
  }

  return data
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Auth API
export const authApi = {
  // Student
  checkNisn: (nisn: string) =>
    apiClient<{ found: boolean; name: string; passwordStatus: string; needSetPassword: boolean }>(
      '/auth/student/check-nisn',
      { method: 'POST', body: { nisn } }
    ),

  studentRegister: (nisn: string, name: string, password: string) =>
    apiClient<{ success: boolean; token: string; user: unknown }>(
      '/auth/student/register',
      { method: 'POST', body: { nisn, name, password } }
    ),

  studentSetPassword: (nisn: string, password: string) =>
    apiClient<{ success: boolean; token: string; user: unknown }>(
      '/auth/student/set-password',
      { method: 'POST', body: { nisn, password } }
    ),

  studentLogin: (nisn: string, password: string) =>
    apiClient<{ token: string; user: unknown }>(
      '/auth/student/login',
      { method: 'POST', body: { nisn, password } }
    ),

  studentChangePassword: (currentPassword: string, newPassword: string, token: string) =>
    apiClient<{ success: boolean; token: string }>(
      '/auth/student/change-password',
      { method: 'POST', body: { currentPassword, newPassword }, token }
    ),

  // Teacher
  teacherRegister: (name: string, email: string, password: string) =>
    apiClient<{ token: string; user: unknown }>(
      '/auth/teacher/register',
      { method: 'POST', body: { name, email, password } }
    ),

  teacherLogin: (email: string, password: string) =>
    apiClient<{ token: string; user: unknown }>(
      '/auth/teacher/login',
      { method: 'POST', body: { email, password } }
    ),

  teacherChangePassword: (currentPassword: string, newPassword: string, token: string) =>
    apiClient<{ success: boolean; token: string }>(
      '/auth/teacher/change-password',
      { method: 'POST', body: { currentPassword, newPassword }, token }
    ),

  // Common
  me: (token: string) =>
    apiClient<{ user: unknown }>('/auth/me', { token }),

  logout: (token: string) =>
    apiClient<{ success: boolean }>('/auth/logout', { method: 'POST', token }),

  // Teacher reset student password
  resetStudentPassword: (studentId: string, token: string) =>
    apiClient<{ success: boolean; message: string }>(
      '/auth/student/reset-password',
      { method: 'POST', body: { studentId }, token }
    ),
}

// Teacher API
export const teacherApi = {
  getClasses: (token: string) =>
    apiClient<{ classes: unknown[] }>('/teacher/classes', { token }),

  createClass: (name: string, grade: string, schoolId: string, token: string) =>
    apiClient<{ class: unknown }>(
      '/teacher/classes',
      { method: 'POST', body: { name, grade, schoolId }, token }
    ),

  getClassDetail: (classId: string, token: string) =>
    apiClient<{ class: unknown; students: unknown[] }>(
      `/teacher/classes/${classId}`,
      { token }
    ),

  addStudent: (classId: string, nisn: string, name: string, token: string) =>
    apiClient<{ student: unknown }>(
      `/teacher/classes/${classId}/students`,
      { method: 'POST', body: { nisn, name }, token }
    ),
}

// Student API
export const studentApi = {
  getProgress: (token: string) =>
    apiClient<{ currentFloor: number; totalFloors: number; currentMaterial: string; accuracy: number }>(
      '/student/progress',
      { token }
    ),

  getMaterials: () =>
    apiClient<{ materials: unknown[] }>('/materials'),
}
