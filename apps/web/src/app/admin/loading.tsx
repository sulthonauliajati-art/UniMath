export default function AdminLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a1a] flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
      </div>
      <p className="text-white/60 text-sm animate-pulse">Memuat...</p>
    </div>
  )
}
