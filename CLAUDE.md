# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
# Start the backend (loads .env.local, activates venv, runs uvicorn with --reload)
bash run_api.sh

# Start the frontend dev server (requires backend on port 8000)
cd frontend && npm run dev   # → http://localhost:5173

# Bootstrap the filings ChromaDB from mock data (required once before first run)
bash scripts/bootstrap_filings.sh

# Index a single filing or news file into ChromaDB
PYTHONPATH=. .venv/bin/python -m ingest.index_filings --file DATA/uploads/filings/some_file.txt
PYTHONPATH=. .venv/bin/python -m ingest.index_news --file DATA/uploads/news/some_file.txt

# Install backend dependencies
.venv/bin/pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install

# --- Docker ---
# Build single-container image (builds frontend + backend together)
docker build -t portfolio-ai .

# Run the container (serves UI + API on port 8000)
docker run -p 8000:8000 \
  -e LMDEPLOY_API_KEY=sk-...your-key... \
  -e LMDEPLOY_BASE_URL=https://api.openai.com/v1 \
  -e LMDEPLOY_MODEL=gpt-5.3-chat-latest \
  portfolio-ai

# Run with a local .env.local file and persistent DATA volume
docker run -p 8000:8000 --env-file .env.local -v $(pwd)/DATA:/app/DATA portfolio-ai
```

## Architecture

RAG-based financial portfolio assistant: FastAPI serves endpoints that combine structured data analysis with LLM-generated narratives.

**Request flow:**
1. API endpoint receives request (`app/api_server.py`)
2. For `/ask`, the keyword-based router (`core/router.py`) classifies intent into `portfolio_summary`, `risk_flags`, `news_impact`, or `qa`
3. The matched service computes structured data (portfolio math, risk rules, news retrieval)
4. A prompt builder (`core/prompt_builder.py`) formats the data into an LLM prompt
5. `LMDeployClient` (`core/lmdeploy_client.py`) sends to any OpenAI-compatible API and returns the narrative
6. Response includes both raw data and LLM summary

**Two RAG collections (ChromaDB + sentence-transformers/all-MiniLM-L6-v2):**
- `chroma_news` — pre-populated, collection name `"news"`
- `chroma_filings` — bootstrapped via script, collection name `"financial_reports"`

**Data layer:** `data/portfolio_loader.py` and `data/news_loader.py` read from static JSON files in `DATA/`. No database for portfolio/news master data.

**Ingestion pipeline:** `ingest/index_filings.py` and `ingest/index_news.py` each contain their own `chunk_text()` and file parsers (duplicated from `ingest/chunker.py` and `ingest/parsers.py`). Supports .txt, .json, .csv. Chunks are 800 chars with 120 char overlap.

## Key Conventions

- **LLM client:** Uses OpenAI SDK pointed at a configurable base URL. Uses `max_completion_tokens` (not `max_tokens`) for GPT-5+ compatibility. The `temperature` parameter is accepted but not passed to the API.
- **Runtime LLM config:** `POST /config/llm` replaces the live `LMDeployClient` instance (base_url, model, api_key) without a server restart. Safe for single-process uvicorn (dev); multi-worker deployments would need a shared config store. `GET /config/llm` returns current config with a masked key hint.
- **Config:** All paths and LLM settings are centralized in `app/config.py`, driven by env vars. `PROJECT_DIR` overrides the base directory (used by HPC deployment).
- **CORS:** `CORSMiddleware` in `app/api_server.py` allows `localhost:5173` (frontend). Update `allow_origins` when deploying to a different host.
- **ChromaDB version pinned to 0.6.3** — the SQLite schema is incompatible with chromadb 1.x. See README for migration notes if you hit `KeyError: '_type'`.
- **PYTHONPATH** must include the project root for module imports to work (handled by `run_api.sh` and `bootstrap_filings.sh`).
- **No test suite exists yet.** There are no tests directory or test files.
- **Frontend:** React 19 + Vite 7 + TypeScript in `frontend/`. CSS Modules for styling, no CSS framework. `erasableSyntaxOnly: true` in tsconfig — avoid TypeScript class parameter properties and enums.
- **Settings modal:** `ApiSettingsModal` (`frontend/src/components/Settings/`) auto-opens on startup if `api_key_configured` is false in `/health`. The gear icon in the sidebar footer opens it voluntarily at any time.
- **Container mode (Docker):** When `frontend/dist/` exists, `app/api_server.py` mounts it as static files and adds a SPA catch-all route `/{full_path:path}` → `index.html`. The original root endpoint `/` was renamed to `/api/status` to avoid conflict with the catch-all. `VITE_API_BASE_URL=""` at build time makes the frontend use relative API paths so everything resolves to the same origin (port 8000).

## Environment

**Backend:**
- Python 3.12, venv at `.venv/`
- Config via `.env.local` (gitignored). Copy from `.env.example`.
- Required env var for LLM calls: `LMDEPLOY_API_KEY`
- Local alternative: Ollama at `http://127.0.0.1:11434/v1` with `LMDEPLOY_API_KEY=ollama`

**Frontend:**
- Node.js 18+, deps in `frontend/node_modules/`
- API base URL defaults to `http://127.0.0.1:8000`. Override with `VITE_API_BASE_URL` in `frontend/.env.local`
- Build output: `frontend/dist/` (production build via `npm run build`)
