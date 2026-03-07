#!/usr/bin/env bash
set -euo pipefail
export HOME=/home/node
FILE="${1:-301_10_fb_rohbauabnahmeprotokoll-2.xlsm}"
OUT="${2:-vba_extracted.txt}"
cd /home/node/.openclaw/workspace/planning
python3 -m oletools.olevba "$FILE" > "$OUT"
echo "OK: $OUT"
