#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load local env vars
if [ -f "$SCRIPT_DIR/.env.local" ]; then
  set -a; source "$SCRIPT_DIR/.env.local"; set +a
  echo "[INFO] Loaded .env.local"
else
  echo "[WARN] .env.local not found — LLM calls will fail without LMDEPLOY_API_KEY"
fi

# Activate venv
if [ ! -f "$SCRIPT_DIR/.venv/bin/activate" ]; then
  echo "[ERR] .venv not found. Run: python3.12 -m venv .venv && pip install -r requirements.txt"
  exit 1
fi
source "$SCRIPT_DIR/.venv/bin/activate"

export PYTHONPATH="$SCRIPT_DIR:${PYTHONPATH:-}"
echo "[INFO] Python: $(python --version)"
echo "[INFO] Docs:   http://127.0.0.1:8000/docs"

exec python -m uvicorn app.api_server:app --host 127.0.0.1 --port 8000 --reload
