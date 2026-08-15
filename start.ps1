# ============================================================
#  CLUB TECH — Démarrage simultané Backend + Frontend
# ============================================================
Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║        CLUB TECH — Démarrage         ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  → Lancement du Backend Flask  (port 5000)..." -ForegroundColor Yellow
Write-Host "  → Lancement du Frontend Vite  (port 3000)..." -ForegroundColor Yellow
Write-Host ""

$rootDir = $PSScriptRoot

# Lance le backend Flask dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$rootDir\backend'; Write-Host ' Backend Flask en cours...' -ForegroundColor Green; python app.py"
)

# Petite pause pour laisser Flask démarrer avant Vite
Start-Sleep -Seconds 1

# Lance le frontend Vite dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$rootDir\frontend'; Write-Host ' Frontend Vite en cours...' -ForegroundColor Cyan; npm run dev"
)

Write-Host "  ✔  Les deux serveurs sont lancés !" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend  →  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend →  http://localhost:3000" -ForegroundColor White
Write-Host ""
