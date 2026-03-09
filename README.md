# Portfolio AI Assistant

A RAG-based financial portfolio assistant powered by FastAPI, ChromaDB, and an OpenAI-compatible LLM.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FastAPI (port 8000)                │
│  GET /portfolio_summary  GET /risk_flags             │
│  GET /news_impact        POST /ask                   │
│  POST /upload/filing     POST /upload/news           │
└────────────────────────┬────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
     ChromaDB        ChromaDB      OpenAI-compatible
   (chroma_news)  (chroma_filings)   LLM API
   5 news docs     2 filing docs   gpt-4o-mini (local)
                                   LLaMA (HPC)
```

**Key modules:**

| Path | Purpose |
|---|---|
| `app/api_server.py` | FastAPI routes |
| `app/config.py` | Env-var driven config (no hard-coded paths) |
| `core/lmdeploy_client.py` | OpenAI-compatible LLM client |
| `core/router.py` | Query intent classification |
| `rag/filings_retriever.py` | ChromaDB retrieval for SEC filings |
| `rag/news_retriever.py` | ChromaDB retrieval for news |
| `services/` | Portfolio summary, risk flags, news impact, QA |
| `ingest/` | Chunking and indexing pipeline |
| `data/` | Data loading utilities |

---

## Local Development Setup

### Prerequisites

- Python 3.12 (`/usr/bin/python3.12`)
- An OpenAI API key **or** a local Ollama server

### 1. Create the virtual environment

```bash
# python3.12-venv may not include ensurepip on Debian/Ubuntu;
# bootstrap pip manually if needed
python3.12 -m venv --without-pip .venv
curl -sS https://bootstrap.pypa.io/get-pip.py | .venv/bin/python3.12
```

Or if ensurepip is available:

```bash
python3.12 -m venv .venv
```

### 2. Install dependencies

```bash
.venv/bin/pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local — fill in LMDEPLOY_API_KEY
```

`.env.local` controls:

| Variable | Default | Purpose |
|---|---|---|
| `LMDEPLOY_BASE_URL` | `https://api.openai.com/v1` | LLM API endpoint |
| `LMDEPLOY_MODEL` | `gpt-4o-mini` | Model name |
| `LMDEPLOY_API_KEY` | *(empty)* | API key — required for LLM calls |
| `HF_HOME` | `DATA/hf_home` | HuggingFace model cache |
| `TOKENIZERS_PARALLELISM` | `false` | Suppress tokenizer warnings |
| `PROJECT_DIR` | *(auto: repo root)* | Override data directory base |

**Alternative: Ollama (no API cost)**

```bash
ollama pull llama3.2:3b
# In .env.local:
# LMDEPLOY_BASE_URL=http://127.0.0.1:11434/v1
# LMDEPLOY_MODEL=llama3.2:3b
# LMDEPLOY_API_KEY=ollama
```

### 4. Bootstrap the filings vector DB

`chroma_news` is pre-populated. `chroma_filings` must be bootstrapped from the mock files:

```bash
bash scripts/bootstrap_filings.sh
```

This indexes `DATA/uploads/filings/filing_apple_q_mock.txt` and `filing_nvidia_q_mock.txt`.
The `all-MiniLM-L6-v2` embedding model (~22 MB) is downloaded on first run and cached in `HF_HOME`.

### 5. Start the server

```bash
bash run_api.sh
```

Docs available at: `http://127.0.0.1:8000/docs`

### Smoke test

```bash
# Health check
curl -s http://127.0.0.1:8000/health | python3 -m json.tool

# Full LLM round-trip (requires valid API key)
curl -s -X POST http://127.0.0.1:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the risk factors in the Apple filing?"}' \
  | python3 -m json.tool
```

---

## Data Directory Structure

```
DATA/
├── portfolio/
│   └── demo_portfolio.json        # 3 holdings: AAPL, NVDA, JPM + $12k cash
├── news/
│   └── demo_news.json             # 3 news items for AAPL, NVDA, JPM
├── filings/
│   └── financial_reports_sec_small_lite/   # HuggingFace dataset (optional)
├── uploads/
│   ├── filings/                   # Filing .txt files uploaded via API
│   └── news/                      # News .txt files uploaded via API
├── processed/
│   ├── filings/
│   └── news/
├── chroma_news/                   # ChromaDB: 5 docs (pre-populated)
├── chroma_filings/                # ChromaDB: 2 docs (bootstrapped)
└── hf_home/                       # HuggingFace model cache
```

---

## HPC Deployment (SLURM)

Use `api_server.sbatch` for GPU cluster deployment. The sbatch script exports all required
env vars (`PROJECT_DIR`, `LMDEPLOY_*`) that override the local defaults in `app/config.py`.
No changes to the sbatch file are needed.

```bash
sbatch api_server.sbatch
```

The sbatch script:
1. Sets up conda env (`lmdeploy_env`)
2. Starts LMDeploy inference server on port 23333
3. Waits for LMDeploy to be ready (up to 15 min)
4. Starts FastAPI on port 8000
5. Keeps the job alive until the API process exits

Access via SSH tunnel from your local machine:

```bash
ssh -L 8000:localhost:8000 <hpc-host>
```

---

## ChromaDB Notes

The `chroma_news` SQLite database was created with an older version of chromadb.
When upgrading, patch the `config_json_str` column if you see a `KeyError: '_type'`:

```python
import chromadb
from chromadb.api.configuration import CollectionConfigurationInternal

cfg = CollectionConfigurationInternal().to_json_str()
# Then: UPDATE collections SET config_json_str = '<cfg>' WHERE name = 'news';
```

**Version pinned to `chromadb==0.6.3`** — the existing SQLite schema (migration level 10)
is incompatible with the chromadb 1.x rewrite.

---

## API Reference

See `portfolio_ai_frontend_mock_api.md` for full request/response schemas and TypeScript types.

**Quick reference:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Service status and route list |
| `GET` | `/health` | LLM connectivity check |
| `GET` | `/portfolio_summary` | Structured summary + LLM narrative |
| `GET` | `/risk_flags` | Rule-based flags + LLM explanation |
| `GET` | `/news_impact` | News matched to holdings + LLM summary |
| `POST` | `/ask` | Unified QA — routes to above or RAG |
| `POST` | `/upload/filing` | Upload and index a filing document |
| `POST` | `/upload/news` | Upload and index a news document |
