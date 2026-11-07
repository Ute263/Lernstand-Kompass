#!/bin/bash
set -e
cd "$(dirname "$0")"
printf '\nLernstand-Kompass – lokal starten\n'
printf 'Browser: http://localhost:8770\n'
printf 'Beenden: Control + C\n\n'
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server 8770 --bind 127.0.0.1
else
  echo 'Python 3 fehlt. Bitte Python 3 installieren.'
  exit 1
fi
