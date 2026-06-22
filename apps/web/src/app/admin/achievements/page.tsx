'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

/* ─── Types ─────────────────────────────────────────────── */
type AchievementType = 'FLOOR' | 'ACCURACY' | 'STREAK' | 'MATERIAL' | 'SPECIAL'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: AchievementType
  requirement: number
  points: number
}

interface FormState {
  name: string
  description: string
  icon: string
  type: AchievementType
  requirement: string // keep as string to avoid NaN when field is being cleared
  points: string
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  icon: '🏆',
  type: 'FLOOR',
  requirement: '10',
  points: '10',
}

const TYPE_OPTIONS: { value: AchievementType; label: string; hint: string }[] = [
  { value: 'FLOOR', label: '🏢 Lantai', hint: 'Mencapai lantai ke-X' },
  { value: 'ACCURACY', label: '🎯 Akurasi', hint: 'Akurasi minimal X%' },
  { value: 'STREAK', label: '🔥 Streak', hint: 'Jawab benar X kali berturut' },
  { value: 'MATERIAL', label: '📚 Materi', hint: 'Selesaikan X materi' },
  { value: 'SPECIAL', label: '✨ Spesial', hint: 'Achievement khusus' },
]

const EMOJI_PRESETS = [
  '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💫',
  '🔥', '⚡', '💎', '👑', '🏅', '🎖️', '🎯',
  '📚', '🧠', '💡', '🚀', '🎓', '🎉',
]

/* ─── Component ─────────────────────────────────────────── */
export default function AdminAchievementsPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const { showToast } = useToast()

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/admin/login')
    }
  }, [user, isLoading, router])

  const fetchAchievements = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/achievements', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Gagal memuat achievements')
      }
      setAchievements(data.achievements || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat achievements'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [token, showToast])

  useEffect(() => {
    if (token) fetchAchievements()
  }, [token, fetchAchievements])

  /* ─── Form handlers ─────────────────────────────────── */
  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowModal(true)
  }

  const openEdit = (achievement: Achievement) => {
    setEditingId(achievement.id)
    setForm({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      requirement: String(achievement.requirement ?? ''),
      points: String(achievement.points ?? ''),
    })
    setFormErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) errs.name = 'Nama wajib diisi'
    if (!form.description.trim()) errs.description = 'Deskripsi wajib diisi'
    if (!form.icon.trim()) errs.icon = 'Icon wajib diisi'
    if (!form.type) errs.type = 'Tipe wajib dipilih'

    const req = Number(form.requirement)
    if (form.requirement.trim() === '' || isNaN(req) || req < 1) {
      errs.requirement = 'Requirement harus angka >= 1'
    }

    const pts = Number(form.points)
    if (form.points.trim() === '' || isNaN(pts) || pts < 0) {
      errs.points = 'Poin harus angka >= 0'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!validate()) {
      showToast('Periksa field yang bertanda merah', 'warning')
      return
    }

    setSaving(true)
    try {
      const payload = {
        id: editingId || undefined,
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon.trim(),
        type: form.type,
        requirement: Number(form.requirement),
        points: Number(form.points),
      }

      const res = await fetch('/api/admin/achievements', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data?.error) {
        throw new Error(data?.error?.message || 'Gagal menyimpan')
      }

      showToast(editingId ? 'Achievement diperbarui' : 'Achievement ditambahkan', 'success')
      closeModal()
      await fetchAchievements()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Delete ───────────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/achievements', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.error) {
        throw new Error(data?.error?.message || 'Gagal menghapus')
      }
      showToast('Achievement dihapus', 'success')
      setDeleteTarget(null)
      await fetchAchievements()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus'
      showToast(msg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const typeLabels: Record<AchievementType, string> = useMemo(
    () => ({
      FLOOR: 'Lantai',
      ACCURACY: 'Akurasi',
      STREAK: 'Streak',
      MATERIAL: 'Materi',
      SPECIAL: 'Spesial',
    }),
    []
  )

  if (isLoading || !user) return <LoadingScreen />

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-text-secondary hover:text-white text-sm mb-2 inline-block"
            >
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">🏆 Kelola Achievements</h1>
            <p className="text-xs text-text-muted mt-1">
              {achievements.length} achievement tersedia
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-uni-primary rounded-lg text-white hover:bg-uni-primary/80 transition-colors"
          >
            + Tambah Achievement
          </button>
        </div>

        {loading ? (
          <div className="text-center text-text-secondary py-8">Memuat…</div>
        ) : achievements.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-text-secondary mb-4">Belum ada achievement</p>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-uni-primary rounded-lg text-white hover:bg-uni-primary/80 transition-colors"
            >
              + Tambah Achievement Pertama
            </button>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <GlassCard className="p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl" aria-hidden>{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{achievement.name}</h3>
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {achievement.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-uni-primary/20 rounded text-uni-primary">
                          {typeLabels[achievement.type]}
                        </span>
                        <span className="px-2 py-0.5 bg-uni-accent/20 rounded text-uni-accent">
                          Target: {achievement.requirement}
                        </span>
                        <span className="px-2 py-0.5 bg-uni-warning/20 rounded text-uni-warning">
                          {achievement.points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => openEdit(achievement)}
                      className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white rounded transition-colors"
                      aria-label={`Edit ${achievement.name}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(achievement)}
                      className="px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors"
                      aria-label={`Hapus ${achievement.name}`}
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── CREATE/EDIT MODAL ──────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? '✏️ Edit Achievement' : '➕ Tambah Achievement'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <FormField label="Nama Achievement" error={formErrors.name} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="cth: Pendaki Lantai 10"
              className={fieldClass(formErrors.name)}
              maxLength={80}
              autoFocus
            />
          </FormField>

          {/* Description */}
          <FormField label="Deskripsi" error={formErrors.description} required>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="cth: Berhasil mencapai lantai 10"
              rows={2}
              className={fieldClass(formErrors.description)}
              maxLength={200}
            />
          </FormField>

          {/* Icon with preset picker */}
          <FormField label="Icon (Emoji)" error={formErrors.icon} required>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className={`${fieldClass(formErrors.icon)} w-20 text-center text-2xl`}
                maxLength={4}
              />
              <span className="text-xs text-text-muted">Pilih dari preset atau ketik emoji</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
                  className={`w-9 h-9 rounded-lg text-xl transition-all ${
                    form.icon === emoji
                      ? 'bg-uni-primary/30 border border-uni-primary'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                  aria-label={`Pilih ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </FormField>

          {/* Type */}
          <FormField label="Tipe" error={formErrors.type} required>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as AchievementType }))
              }
              className={fieldClass(formErrors.type)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-uni-bg">
                  {opt.label} — {opt.hint}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Requirement (target angka)" error={formErrors.requirement} required>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={form.requirement}
                onChange={(e) => setForm((f) => ({ ...f, requirement: e.target.value }))}
                className={fieldClass(formErrors.requirement)}
              />
            </FormField>
            <FormField label="Poin Reward" error={formErrors.points} required>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                className={fieldClass(formErrors.points)}
              />
            </FormField>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-uni-primary rounded-lg text-white font-semibold hover:bg-uni-primary/80 transition-colors disabled:opacity-60"
            >
              {saving
                ? editingId
                  ? 'Menyimpan…'
                  : 'Menambahkan…'
                : editingId
                  ? 'Simpan Perubahan'
                  : 'Tambah Achievement'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white rounded-lg transition-colors disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>

      {/* ── DELETE CONFIRM ────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Achievement?"
        message={`"${deleteTarget?.name || ''}" akan dihapus permanen. Lanjutkan?`}
        confirmText="Hapus"
        variant="danger"
        loading={deleting}
      />
    </main>
  )
}

/* ─── Helpers ──────────────────────────────────────────── */
function fieldClass(error?: string) {
  return [
    'w-full px-3 py-2 bg-uni-bg-secondary/50 border rounded-lg text-white placeholder:text-text-muted/60 focus:outline-none transition-colors',
    error
      ? 'border-uni-error focus:border-uni-error'
      : 'border-white/10 focus:border-uni-primary',
  ].join(' ')
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm text-text-secondary mb-1">
        {label}
        {required && <span className="text-uni-error ml-1">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-uni-error mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
