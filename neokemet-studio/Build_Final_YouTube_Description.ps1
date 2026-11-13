# Run this script inside the neokemet-studio folder, beside package.json.
# It creates an upload-ready description using chapter timings from the ACTUAL MP3-based timeline.
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$slug = "the-royal-cache-full-documentary"
$projectYoutube = Join-Path $root ("projects\" + $slug + "\youtube")
$chapters = Join-Path $projectYoutube "YouTube_chapters_audio_timed.txt"
$templatePath = Join-Path $root "The_Royal_Cache_YouTube_Description_Template.txt"
if (-not (Test-Path -LiteralPath $chapters)) {
  Write-Host "Audio-timed chapters file not found:" -ForegroundColor Yellow
  Write-Host $chapters
  Write-Host "First run in this neokemet-studio folder:"
  Write-Host "  npx tsx .\export-royal-cache-srt.ts the-royal-cache-full-documentary"
  exit 1
}
if (-not (Test-Path -LiteralPath $templatePath)) {
  Write-Host "Missing description template: $templatePath" -ForegroundColor Red
  exit 1
}
$chapterText = (Get-Content -LiteralPath $chapters -Raw -Encoding UTF8).Trim()
$chapterRows = @($chapterText -split "`r?`n" | Where-Object { $_ -match '^\d{1,2}:\d{2}(?::\d{2})?\s+\S' })
if ($chapterRows.Count -lt 3 -or $chapterRows[0] -notmatch '^(00:00|0:00)\s+') {
  Write-Host "Chapter file is incomplete or cannot create valid YouTube chapters." -ForegroundColor Red
  exit 1
}
$templateText = Get-Content -LiteralPath $templatePath -Raw -Encoding UTF8
if (-not $templateText.Contains("{{CHAPTERS}}")) { throw "Template is missing {{CHAPTERS}} marker." }
$finalText = $templateText.Replace("{{CHAPTERS}}", $chapterText)
$output = Join-Path $projectYoutube "The_Royal_Cache_YouTube_Description_Final.txt"
Set-Content -LiteralPath $output -Value $finalText -Encoding UTF8
Write-Host "Complete YouTube description with accurate scene-start chapter timings:" -ForegroundColor Green
Write-Host $output
Write-Host "Check chapters once against your final MP4 before publication."
