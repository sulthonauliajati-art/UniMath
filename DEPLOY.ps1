Write-Host "========================================" -ForegroundColor Cyan
Write-Host " UniMath — Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location "d:\UniMath"

Write-Host "`n[1/3] Menjalankan db:push (migrasi schema optE ke Turso)..." -ForegroundColor Yellow
pnpm --filter web db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "  GAGAL db:push. Lanjut ke commit..." -ForegroundColor Red
} else {
    Write-Host "  db:push BERHASIL." -ForegroundColor Green
}

Write-Host "`n[2/3] Staging semua perubahan..." -ForegroundColor Yellow
git add -A
git status --short

Write-Host "`n[3/3] Commit dan push ke Vercel..." -ForegroundColor Yellow
git commit -m "feat: opsi E wajib A-E, export CSV arsip, fix cascade delete soal"
git push

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " SELESAI! Tunggu Vercel deploy ~1 menit" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nSetelah deploy:" -ForegroundColor White
Write-Host "  1. Buka admin/questions" -ForegroundColor White
Write-Host "  2. Pilih materi" -ForegroundColor White
Write-Host "  3. Klik Hapus Semua Soal (sekarang sudah bisa)" -ForegroundColor White
Write-Host "  4. Upload file unimath_import_16kolom.csv" -ForegroundColor White

Read-Host "`nTekan Enter untuk menutup..."
