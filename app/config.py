import os
from pathlib import Path

# Falls back to the repo root relative to this file (portable default)
_default_base = Path(__file__).resolve().parent.parent
BASE_DIR = Path(os.getenv("PROJECT_DIR", str(_default_base)))
DATA_DIR = BASE_DIR / "DATA"

# ===== Base data =====
PORTFOLIO_PATH = DATA_DIR / "portfolio" / "demo_portfolio.json"
NEWS_PATH = DATA_DIR / "news" / "demo_news.json"
FILINGS_DATASET_PATH = DATA_DIR / "filings" / "financial_reports_sec_small_lite"

# ===== Upload / processed =====
UPLOAD_FILINGS_DIR = DATA_DIR / "uploads" / "filings"
UPLOAD_NEWS_DIR = DATA_DIR / "uploads" / "news"
PROCESSED_FILINGS_DIR = DATA_DIR / "processed" / "filings"
PROCESSED_NEWS_DIR = DATA_DIR / "processed" / "news"

# ===== Vector DB =====
CHROMA_FILINGS_PATH = DATA_DIR / "chroma_filings"
CHROMA_NEWS_PATH = DATA_DIR / "chroma_news"
FILINGS_COLLECTION = "financial_reports"
NEWS_COLLECTION = "news"

EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# ===== LMDeploy / LLM =====
LMDEPLOY_BASE_URL = os.getenv("LMDEPLOY_BASE_URL", "https://api.openai.com/v1/")
LMDEPLOY_MODEL = os.getenv("LMDEPLOY_MODEL", "gpt-5.3-chat-latest")
LMDEPLOY_API_KEY = os.getenv("LMDEPLOY_API_KEY", "")

# ===== Ingestion =====
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120
MAX_RETRIEVE_DOCS = 4


def ensure_directories() -> None:
    dirs = [
        DATA_DIR,
        UPLOAD_FILINGS_DIR,
        UPLOAD_NEWS_DIR,
        PROCESSED_FILINGS_DIR,
        PROCESSED_NEWS_DIR,
        CHROMA_FILINGS_PATH,
        CHROMA_NEWS_PATH,
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
