import { TowerBackground } from '@/components/ui/TowerBackground'

export default function StudentLoading() {
  return (
    <TowerBackground variant="practice">
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
        </div>
        <p className="text-white/60 text-sm animate-pulse">Memuat...</p>
      </div>
    </TowerBackground>
  )
}
