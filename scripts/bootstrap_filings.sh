#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

[ -f "$PROJECT_DIR/.env.local" ] && { set -a; source "$PROJECT_DIR/.env.local"; set +a; }
source "$PROJECT_DIR/.venv/bin/activate"
export PYTHONPATH="$PROJECT_DIR:${PYTHONPATH:-}"

cp -rn DATA/chroma_news DATA/chroma_news.bak 2>/dev/null || true  # safety backup

python -m ingest.index_filings --file DATA/uploads/filings/filing_apple_q_mock.txt
python -m ingest.index_filings --file DATA/uploads/filings/filing_nvidia_q_mock.txt

echo "[INFO] Done. chroma_filings bootstrapped with 2 filings."
