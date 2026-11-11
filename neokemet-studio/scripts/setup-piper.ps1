# Installs Piper (offline text-to-speech) and one English voice into tools\.
# Run once, from the neokemet-studio folder:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-piper.ps1
# Optional: -Voice en_US-ryan-high   (any voice from https://huggingface.co/rhasspy/piper-voices)
param([string]$Voice = "en_GB-alan-medium")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$tools = Join-Path $root "tools"
New-Item -ItemType Directory -Force -Path (Join-Path $tools "piper"), (Join-Path $tools "voices") | Out-Null

$exe = Join-Path $tools "piper\piper\piper.exe"
if (-not (Test-Path $exe)) {
  Write-Host "Downloading Piper for Windows..."
  $zip = Join-Path $tools "piper.zip"
  Invoke-WebRequest "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip" -OutFile $zip
  Expand-Archive $zip -DestinationPath (Join-Path $tools "piper") -Force
  Remove-Item $zip
}

# voice name → folder on Hugging Face, e.g. en_GB-alan-medium → en/en_GB/alan/medium
$parts = $Voice -split "-"
$lang = $parts[0]; $name = $parts[1]; $quality = $parts[2]
$base = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/$($lang.Split('_')[0])/$lang/$name/$quality/$Voice"
foreach ($ext in ".onnx", ".onnx.json") {
  $out = Join-Path $tools "voices\$Voice$ext"
  if (-not (Test-Path $out)) { Write-Host "Downloading voice $Voice$ext ..."; Invoke-WebRequest "$base$ext" -OutFile $out }
}
Write-Host ""
Write-Host "Piper is ready: $exe"
Write-Host "Voice: $Voice  (restart the studio if it is running)"
