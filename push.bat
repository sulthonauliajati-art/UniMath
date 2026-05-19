@echo off
chcp 65001 >nul
cd /d "D:\UniMath"

echo.
echo ========================================
echo   UniMath - Auto Commit ^& Push
echo ========================================
echo.

:: Check if there are changes
git status --short >nul 2>&1
for /f %%i in ('git status --short') do goto HAS_CHANGES
echo [INFO] Tidak ada perubahan untuk di-commit.
echo.
pause
exit /b 0

:HAS_CHANGES
echo [1/4] Perubahan terdeteksi:
echo.
git status --short
echo.

:: Ask for commit message
set /p MSG="Tulis pesan commit (atau tekan Enter untuk default): "
if "%MSG%"=="" set MSG=update: sync latest changes

echo.
echo [2/4] Staging semua file...
git add .

echo.
echo [3/4] Membuat commit...
git commit -m "%MSG%"

echo.
echo [4/4] Pushing ke GitHub (origin/main)...
git push origin main

echo.
echo ========================================
if %ERRORLEVEL%==0 (
    echo   SUKSES! Vercel akan auto-deploy.
) else (
    echo   Push selesai. Cek output di atas.
)
echo ========================================
echo.
pause
