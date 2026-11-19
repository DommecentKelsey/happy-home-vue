#!/bin/zsh
# Dubbelklik om de Happy home dev-server te starten (http://localhost:5173).
cd "$(dirname "$0")" || exit 1
[ -d node_modules ] || npm install
npm run dev -- --open
