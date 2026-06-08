'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Teacher {
  id: string
  name: string
  email: string | null
  createdAt: string
  passwordStatus: string | null
  points: number | null
}

interface Student {
  id: string
  name: string
  nisn: string | null
  totalPoints: number | null
  passwordStatus: string | null
  createdAt: string
  // ✅ FIX #14: Statistik latihan
  totalSessions: number
  highestFloor: number
  accuracy: number
  totalAttempts: number
  lastPracticeAt: string | null
}

type TabKey = 'teachers' | 'students'

interface EditorState {
  mode: 'create' | 'edit'
  tab: TabKey
  // Shared
  id?: string
  name: string
  // Teacher
  email?: string
  // Student
  nisn?: string
  // Optional (create only)
  password?: string
}

const EMPTY_FORM: EditorState = {
  mode: 'create',
  tab: 'teachers',
  name: '',
  email: '',
  nisn: '',
  password: '',
}

export default function AdminUsersClient() {
  const { user, token, isLoading } = useAuth()
  const { showToast } = useToast()

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('teachers')
  const [search, setSearch] = useState('')

  const [editor, setEditor] = useState<EditorState | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EditorState, string>>>({})

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; role: TabKey } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null)
  const [resetting, setResetting] = useState(false)
  const [tempPasswordReveal, setTempPasswordReveal] = useState<{ user: string; password: string } | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Gagal memuat users')
      setTeachers(data.teachers || [])
      setStudents(data.students || [])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memuat users', 'error')
    } finally {
      setLoading(false)
    }
  }, [token, showToast])

  useEffect(() => {
    if (token) fetchUsers()
  }, [token, fetchUsers])

  /* ─── Editor handlers ─────────────────────────────── */
  const openCreate = () => {
    setEditor({ ...EMPTY_FORM, mode: 'create', tab: activeTab })
    setFormErrors({})
  }

  const openEditTeacher = (t: Teacher) => {
    setEditor({
      mode: 'edit',
      tab: 'teachers',
      id: t.id,
      name: t.name,
      email: t.email || '',
    })
    setFormErrors({})
  }

  const openEditStudent = (s: Student) => {
    setEditor({
      mode: 'edit',
      tab: 'students',
      id: s.id,
      name: s.name,
      nisn: s.nisn || '',
    })
    setFormErrors({})
  }

  const closeEditor = () => {
    if (saving) return
    setEditor(null)
    setFormErrors({})
  }

  const validate = (ed: EditorState): boolean => {
    const errs: Partial<Record<keyof EditorState, string>> = {}
    if (!ed.name.trim() || ed.name.trim().length < 3) {
      errs.name = 'Nama minimal 3 karakter'
    }
    if (ed.tab === 'teachers') {
      const email = (ed.email || '').trim()
      if (!email) errs.email = 'Email wajib diisi'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format email tidak valid'
    } else {
      const nisn = (ed.nisn || '').trim()
      if (!nisn) errs.nisn = 'NISN wajib diisi'
      else if (!/^\d+$/.test(nisn)) errs.nisn = 'NISN harus angka'
    }
    if (ed.mode === 'create' && ed.password) {
      if (ed.password.length < 6) errs.password = 'Password minimal 6 karakter'
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!editor || saving || !token) return
    if (!validate(editor)) return
    setSaving(true)
    try {
      if (editor.mode === 'create') {
        const body: Record<string, unknown> = {
          role: editor.tab === 'teachers' ? 'TEACHER' : 'STUDENT',
          name: editor.name.trim(),
          password: editor.password || undefined,
        }
        if (editor.tab === 'teachers') body.email = editor.email?.trim()
        else body.nisn = editor.nisn?.trim()

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok || data?.error) throw new Error(data?.error?.message || 'Gagal menambah user')

        if (data.tempPassword) {
          setTempPasswordReveal({ user: editor.name, password: data.tempPassword })
        }
        showToast('User berhasil ditambahkan', 'success')
      } else {
        const body: Record<string, unknown> = {
          id: editor.id,
          name: editor.name.trim(),
        }
        if (editor.tab === 'teachers') body.email = editor.email?.trim()
        else body.nisn = editor.nisn?.trim()

        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok || data?.error) throw new Error(data?.error?.message || 'Gagal menyimpan')
        showToast('Perubahan disimpan', 'success')
      }
      setEditor(null)
      await fetchUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Reset password ──────────────────────────────── */
  const confirmReset = async () => {
    if (!resetTarget || !token) return
    setResetting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: resetTarget.id, resetPassword: true }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) throw new Error(data?.error?.message || 'Gagal reset password')
      if (data.tempPassword) {
        setTempPasswordReveal({ user: resetTarget.name, password: data.tempPassword })
      }
      showToast('Password di-reset', 'success')
      setResetTarget(null)
      await fetchUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal reset password', 'error')
    } finally {
      setResetting(false)
    }
  }

  /* ─── Delete ──────────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget || !token) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) throw new Error(data?.error?.message || 'Gagal menghapus')
      showToast('User dihapus', 'success')
      setDeleteTarget(null)
      await fetchUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading || !user) return <LoadingScreen />

  const q = search.trim().toLowerCase()
  const filteredTeachers = q
    ? teachers.filter(
        (t) => t.name.toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q)
      )
    : teachers
  const filteredStudents = q
    ? students.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.nisn || '').toLowerCase().includes(q)
      )
    : students

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-text-secondary hover:text-white text-sm mb-2 inline-block"
            >
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">👥 Kelola Users</h1>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-uni-primary rounded-lg text-white hover:bg-uni-primary/80 transition-colors"
          >
            {activeTab === 'teachers' ? '+ Tambah Guru' : '+ Tambah Siswa'}
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'teachers'
                ? 'bg-uni-primary text-white'
                : 'bg-uni-bg-secondary/50 text-text-secondary hover:text-white'
            }`}
          >
            Guru ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'students'
                ? 'bg-uni-primary text-white'
                : 'bg-uni-bg-secondary/50 text-text-secondary hover:text-white'
            }`}
          >
            Siswa ({students.length})
          </button>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / email / NISN…"
            className="ml-auto px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-text-muted focus:border-uni-primary focus:outline-none min-w-[200px]"
          />
        </div>

        {loading ? (
          <div className="text-center text-text-secondary py-8">Memuat…</div>
        ) : activeTab === 'teachers' ? (
          filteredTeachers.length === 0 ? (
            <GlassCard className="p-6 text-center text-text-secondary">
              {teachers.length === 0 ? 'Belum ada guru terdaftar' : 'Tidak ada guru yang cocok'}
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {filteredTeachers.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{t.name}</h3>
                        <p className="text-sm text-text-secondary">{t.email || 'No email'}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className={t.passwordStatus === 'SET' ? 'text-green-400' : 'text-yellow-400'}>
                            {t.passwordStatus === 'SET' ? '✓ Password aktif' : '⚠ Password belum diset'}
                          </span>
                          <span className="text-text-muted">·</span>
                          <span className="text-uni-warning">{t.points || 0} poin</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <ActionBtn onClick={() => openEditTeacher(t)} label="Edit" emoji="✏️" />
                        <ActionBtn
                          onClick={() => setResetTarget({ id: t.id, name: t.name })}
                          label="Reset Password"
                          emoji="🔑"
                        />
                        <ActionBtn
                          onClick={() =>
                            setDeleteTarget({ id: t.id, name: t.name, role: 'teachers' })
                          }
                          label="Hapus"
                          emoji="🗑️"
                          danger
                        />
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )
        ) : filteredStudents.length === 0 ? (
          <GlassCard className="p-6 text-center text-text-secondary">
            {students.length === 0 ? 'Belum ada siswa terdaftar' : 'Tidak ada siswa yang cocok'}
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{s.name}</h3>
                      <p className="text-sm text-text-secondary">NISN: {s.nisn || '-'}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                        <span className={s.passwordStatus === 'SET' ? 'text-green-400' : 'text-yellow-400'}>
                          {s.passwordStatus === 'SET' ? '✓ Aktif' : '⚠ Belum set'}
                        </span>
                        <span className="text-text-muted">·</span>
                        <span className="text-uni-primary">{s.totalPoints || 0} XP</span>
                        {(s.totalSessions ?? 0) > 0 ? (
                          <>
                            <span className="text-text-muted">·</span>
                            <span className="text-cyan-300">{s.totalSessions} sesi</span>
                            <span className="text-text-muted">·</span>
                            <span className="text-emerald-300">🏢 {s.highestFloor}</span>
                            <span className="text-text-muted">·</span>
                            <span className={s.accuracy >= 75 ? 'text-emerald-300' : s.accuracy >= 50 ? 'text-amber-300' : 'text-red-300'}>
                              🎯 {s.accuracy}%
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-text-muted">·</span>
                            <span className="text-text-muted italic">Belum latihan</span>
                          </>
                        )}
                      </div>
                      {s.lastPracticeAt && (
                        <p className="text-[11px] text-text-muted mt-1">
                          Terakhir: {new Date(s.lastPracticeAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <ActionBtn onClick={() => openEditStudent(s)} label="Edit" emoji="✏️" />
                      <ActionBtn
                        onClick={() => setResetTarget({ id: s.id, name: s.name })}
                        label="Reset Password"
                        emoji="🔑"
                      />
                      <ActionBtn
                        onClick={() =>
                          setDeleteTarget({ id: s.id, name: s.name, role: 'students' })
                        }
                        label="Hapus"
                        emoji="🗑️"
                        danger
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── EDITOR MODAL ───────────────────────────────────── */}
      <Modal
        isOpen={!!editor}
        onClose={closeEditor}
        title={
          editor
            ? `${editor.mode === 'create' ? '➕ Tambah' : '✏️ Edit'} ${
                editor.tab === 'teachers' ? 'Guru' : 'Siswa'
              }`
            : ''
        }
        size="md"
      >
        {editor && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Nama <span className="text-uni-error">*</span>
              </label>
              <input
                type="text"
                value={editor.name}
                onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                placeholder="Nama lengkap"
                className={fieldClass(!!formErrors.name)}
                autoFocus
              />
              {formErrors.name && <p className="text-xs text-uni-error mt-1">{formErrors.name}</p>}
            </div>

            {editor.tab === 'teachers' ? (
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Email <span className="text-uni-error">*</span>
                </label>
                <input
                  type="email"
                  value={editor.email || ''}
                  onChange={(e) => setEditor({ ...editor, email: e.target.value })}
                  placeholder="guru@sekolah.sch.id"
                  className={fieldClass(!!formErrors.email)}
                />
                {formErrors.email && (
                  <p className="text-xs text-uni-error mt-1">{formErrors.email}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  NISN <span className="text-uni-error">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editor.nisn || ''}
                  onChange={(e) => setEditor({ ...editor, nisn: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234567890"
                  className={fieldClass(!!formErrors.nisn)}
                />
                {formErrors.nisn && <p className="text-xs text-uni-error mt-1">{formErrors.nisn}</p>}
              </div>
            )}

            {editor.mode === 'create' && (
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Password Awal <span className="text-text-muted text-xs">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={editor.password || ''}
                  onChange={(e) => setEditor({ ...editor, password: e.target.value })}
                  placeholder="Kosongkan untuk generate otomatis (8 karakter)"
                  className={fieldClass(!!formErrors.password)}
                />
                {formErrors.password && (
                  <p className="text-xs text-uni-error mt-1">{formErrors.password}</p>
                )}
                <p className="text-xs text-text-muted mt-1">
                  {editor.password
                    ? 'Password ini akan dipakai user untuk login pertama kali.'
                    : 'Jika kosong, sistem akan generate password sementara dan menampilkan sekali di layar.'}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-uni-primary rounded-lg text-white font-semibold hover:bg-uni-primary/80 transition-colors disabled:opacity-60"
              >
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white rounded-lg transition-colors disabled:opacity-60"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── RESET PASSWORD CONFIRM ─────────────────────────── */}
      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => !resetting && setResetTarget(null)}
        onConfirm={confirmReset}
        title="Reset Password?"
        message={`Password user "${resetTarget?.name || ''}" akan di-reset jadi password sementara. Semua sesi login aktif akan dibatalkan. Lanjutkan?`}
        confirmText="Reset"
        variant="warning"
        loading={resetting}
      />

      {/* ── DELETE CONFIRM ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus User?"
        message={`"${deleteTarget?.name || ''}" akan dihapus permanen. Jika user ini sudah punya data latihan, penghapusan akan gagal dan kamu perlu menghapus data terkait lebih dulu.`}
        confirmText="Hapus"
        variant="danger"
        loading={deleting}
      />

      {/* ── TEMP PASSWORD REVEAL ──────────────────────────── */}
      <Modal
        isOpen={!!tempPasswordReveal}
        onClose={() => setTempPasswordReveal(null)}
        title="🔑 Password Sementara"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Password sementara untuk <b className="text-white">{tempPasswordReveal?.user}</b>. Salin
            sekarang — password ini tidak akan ditampilkan lagi.
          </p>
          <div className="p-4 bg-uni-primary/10 border border-uni-primary/40 rounded-lg text-center">
            <code className="text-2xl font-mono font-bold text-uni-primary tracking-widest">
              {tempPasswordReveal?.password}
            </code>
          </div>
          <button
            onClick={() => {
              if (tempPasswordReveal?.password) {
                navigator.clipboard.writeText(tempPasswordReveal.password)
                showToast('Password tersalin ke clipboard', 'success')
              }
            }}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white rounded-lg transition-colors text-sm"
          >
            📋 Salin ke Clipboard
          </button>
          <button
            onClick={() => setTempPasswordReveal(null)}
            className="w-full py-2 bg-uni-primary rounded-lg text-white font-semibold hover:bg-uni-primary/80 transition-colors"
          >
            Selesai
          </button>
        </div>
      </Modal>
    </main>
  )
}

/* ─── Helpers ─────────────────────────────────────────────── */
function fieldClass(hasError: boolean) {
  return [
    'w-full px-3 py-2 bg-uni-bg-secondary/50 border rounded-lg text-white placeholder:text-text-muted/60 focus:outline-none transition-colors',
    hasError
      ? 'border-uni-error focus:border-uni-error'
      : 'border-white/10 focus:border-uni-primary',
  ].join(' ')
}

function ActionBtn({
  onClick,
  label,
  emoji,
  danger,
}: {
  onClick: () => void
  label: string
  emoji: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`px-2 py-1 rounded text-xs transition-colors ${
        danger
          ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
          : 'text-text-secondary hover:text-white hover:bg-white/10'
      }`}
    >
      <span className="hidden sm:inline mr-1">{emoji}</span>
      {label}
    </button>
  )
}
