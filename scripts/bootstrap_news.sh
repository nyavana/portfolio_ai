#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

[ -f "$PROJECT_DIR/.env.local" ] && { set -a; source "$PROJECT_DIR/.env.local"; set +a; }
source "$PROJECT_DIR/.venv/bin/activate"
export PYTHONPATH="$PROJECT_DIR:${PYTHONPATH:-}"

cp -rn DATA/chroma_news DATA/chroma_news.bak 2>/dev/null || true

python - <<'PY'
from __future__ import annotations

import chromadb

from app.config import CHROMA_NEWS_PATH, NEWS_COLLECTION

client = chromadb.PersistentClient(path=str(CHROMA_NEWS_PATH))

try:
    client.delete_collection(NEWS_COLLECTION)
except Exception:
    pass

client.get_or_create_collection(NEWS_COLLECTION)
print("[INFO] Reset news collection.")
PY

python -m ingest.index_news --file DATA/news/demo_news.json

shopt -s nullglob
for news_file in DATA/uploads/news/*; do
  python -m ingest.index_news --file "$news_file"
done

echo "[INFO] Done. chroma_news bootstrapped from demo news and uploaded news files."
