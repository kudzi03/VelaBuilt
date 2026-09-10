#!/usr/bin/env bash
# Restart the production server cleanly on port 3000.
# `next start` survives a plain kill of its wrapper, so target next-server itself.
set -u
LOG="${1:-/tmp/velabuilt-server.log}"

pkill -f "next-server" >/dev/null 2>&1 || true
sleep 2

setsid nohup npx next start -p 3000 > "$LOG" 2>&1 < /dev/null &
sleep 7

code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo 000)
echo "server: $code"
[ "$code" = "200" ] || tail -12 "$LOG"
