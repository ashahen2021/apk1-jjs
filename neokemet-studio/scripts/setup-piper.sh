#!/usr/bin/env bash
# Installs Piper (offline text-to-speech) and one English voice into tools/ (Linux x86-64).
#   bash scripts/setup-piper.sh [voice]      e.g. en_US-ryan-high
set -euo pipefail
VOICE="${1:-en_GB-alan-medium}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/tools/piper" "$ROOT/tools/voices"
if [ ! -x "$ROOT/tools/piper/piper/piper" ]; then
  curl -fsSL -o "$ROOT/tools/piper.tgz" https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz
  tar xzf "$ROOT/tools/piper.tgz" -C "$ROOT/tools/piper" && rm "$ROOT/tools/piper.tgz"
fi
IFS=- read -r LANG_ NAME QUALITY <<< "$VOICE"
BASE="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/${LANG_%%_*}/$LANG_/$NAME/$QUALITY/$VOICE"
for ext in .onnx .onnx.json; do [ -f "$ROOT/tools/voices/$VOICE$ext" ] || curl -fsSL -o "$ROOT/tools/voices/$VOICE$ext" "$BASE$ext"; done
echo "Piper is ready. Voice: $VOICE"
