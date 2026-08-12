#!/bin/sh
set -e

if [ ! -f dist/index.html ]; then
  echo "ERROR: dist/index.html not found. Build step must run before start."
  exit 1
fi

PORT="${PORT:-3000}"
echo "Starting static server on 0.0.0.0:${PORT}"
exec serve dist -s -l "tcp://0.0.0.0:${PORT}"
