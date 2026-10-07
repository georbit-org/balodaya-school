# Balodaya v2 Automated Quality Gates
$ErrorCount = 0

Write-Host "Running Balodaya v2 Quality Gates..." -ForegroundColor Cyan

$srcFiles = Get-ChildItem -Path src -Recurse -File -Include *.ts,*.tsx,*.css,*.json

# G1: No icon libraries
$g1 = ($srcFiles | Select-String -Pattern "lucide|react-icons|fontawesome").Count
if ($null -eq $g1) { $g1 = 0 }
Write-Host "G1 (Icon libraries count, must be 0): $g1"
if ($g1 -gt 0) { $ErrorCount++ }

# G2: No emoji / decorative symbols
$g2 = ($srcFiles | Select-String -Pattern "[\u2605\u2713\u2714\u2728]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]").Count
if ($null -eq $g2) { $g2 = 0 }
Write-Host "G2 (Emoji / symbol glyphs count, must be 0): $g2"
if ($g2 -gt 0) { $ErrorCount++ }

# G3: No coloured card edges (only legitimate hairline rules are allowed)
$g3Matches = $srcFiles | Select-String -Pattern "borderLeft|borderTop|border-left:|border-top:" | Where-Object { $_.Line -notmatch "var\(--rule" }
$g3 = ($g3Matches).Count
if ($null -eq $g3) { $g3 = 0 }
Write-Host "G3 (Coloured card edges count, must be 0): $g3"
if ($g3 -gt 0) { $ErrorCount++ }

# G6: No fabrication words (fabricated metrics, fake house names, fake claims)
$g6 = ($srcFiles | Select-String -Pattern "100%\s*(pass|result|record)|testimonial|Lorem|Sagarmatha House|Kanchanjunga|CCTV|GPS").Count
if ($null -eq $g6) { $g6 = 0 }
Write-Host "G6 (Fabricated claims count, must be 0): $g6"
if ($g6 -gt 0) { $ErrorCount++ }

Write-Host "-------------------------------------------"
if ($ErrorCount -eq 0) {
    Write-Host "All Quality Gates PASSED successfully! (0 violations)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$ErrorCount Quality Gates FAILED!" -ForegroundColor Red
    exit 1
}
