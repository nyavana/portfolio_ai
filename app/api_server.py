from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import ensure_directories, UPLOAD_FILINGS_DIR, UPLOAD_NEWS_DIR
from app.schemas import QuestionRequest, LlmConfigRequest, LlmConfigResponse
from core.lmdeploy_client import LMDeployClient
from core.prompt_builder import (
    build_news_impact_prompt,
    build_portfolio_summary_prompt,
    build_risk_flags_prompt,
)
from core.router import route_query
from ingest.index_filings import index_one_file as index_one_filing
from ingest.index_news import index_one_file as index_one_news
from services.news_impact import get_news_impact
from services.portfolio_summary import compute_portfolio_summary
from services.qa_service import answer_financial_question
from services.risk_flags import detect_risk_flags


app = FastAPI(title="Portfolio AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_directories()
llm = LMDeployClient()


@app.get("/api/status")
def root():
    return {
        "status": "ok",
        "message": "Portfolio AI Assistant is running",
        "routes": [
            "/health",
            "/portfolio_summary",
            "/risk_flags",
            "/news_impact",
            "/ask",
            "/upload/filing",
            "/upload/news",
            "/docs",
        ],
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "lmdeploy_base_url": llm.base_url,
        "lmdeploy_model": llm.model,
        "api_key_configured": bool(llm.api_key and llm.api_key != "ollama"),
    }


def _make_config_response() -> LlmConfigResponse:
    key = llm.api_key
    configured = bool(key and key != "ollama")
    hint = (key[:6] + "****") if (configured and len(key) > 8) else ("****" if configured else "")
    return LlmConfigResponse(
        base_url=llm.base_url,
        model=llm.model,
        api_key_configured=configured,
        api_key_hint=hint,
    )


@app.get("/config/llm", response_model=LlmConfigResponse)
def get_llm_config():
    return _make_config_response()


@app.post("/config/llm", response_model=LlmConfigResponse)
def update_llm_config(req: LlmConfigRequest):
    global llm
    llm = LMDeployClient(
        base_url=(req.base_url.rstrip("/") if req.base_url else llm.base_url),
        model=(req.model or llm.model),
        api_key=(req.api_key or llm.api_key),
    )
    return _make_config_response()


@app.post("/upload/filing")
def upload_filing(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="empty filename")

    save_dir = Path(UPLOAD_FILINGS_DIR)
    save_dir.mkdir(parents=True, exist_ok=True)
    save_path = save_dir / file.filename

    try:
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to save filing: {e}")

    try:
        index_result = index_one_filing(str(save_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to index filing: {e}")

    return {
        "status": "ok",
        "saved_to": str(save_path),
        "index_result": index_result,
    }


@app.post("/upload/news")
def upload_news(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="empty filename")

    save_dir = Path(UPLOAD_NEWS_DIR)
    save_dir.mkdir(parents=True, exist_ok=True)
    save_path = save_dir / file.filename

    try:
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to save news file: {e}")

    try:
        index_result = index_one_news(str(save_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to index news file: {e}")

    return {
        "status": "ok",
        "saved_to": str(save_path),
        "index_result": index_result,
    }


@app.get("/portfolio_summary")
def portfolio_summary():
    summary = compute_portfolio_summary()
    prompt = build_portfolio_summary_prompt(summary)
    answer = llm.chat("You are a financial portfolio assistant.", prompt)
    return {"summary_data": summary, "llm_summary": answer}


@app.get("/risk_flags")
def risk_flags():
    summary = compute_portfolio_summary()
    flags = detect_risk_flags()
    prompt = build_risk_flags_prompt(flags, summary)
    answer = llm.chat("You are a careful financial risk assistant.", prompt)
    return {"flags": flags, "llm_risk_summary": answer}


@app.get("/news_impact")
def news_impact():
    result = get_news_impact()
    prompt = build_news_impact_prompt(result)
    answer = llm.chat(
        "You are a financial assistant analyzing portfolio news impact.",
        prompt,
    )
    return {"news_data": result, "llm_news_summary": answer}


@app.post("/ask")
def ask(req: QuestionRequest):
    route = route_query(req.question)

    if route == "portfolio_summary":
        summary = compute_portfolio_summary()
        prompt = build_portfolio_summary_prompt(summary) + f"\n\nUser question: {req.question}"
        answer = llm.chat("You are a financial portfolio assistant.", prompt)
        return {"route": route, "answer": answer, "data": summary}

    if route == "risk_flags":
        summary = compute_portfolio_summary()
        flags = detect_risk_flags()
        prompt = build_risk_flags_prompt(flags, summary) + f"\n\nUser question: {req.question}"
        answer = llm.chat("You are a careful financial risk assistant.", prompt)
        return {"route": route, "answer": answer, "data": flags}

    if route == "news_impact":
        news = get_news_impact()
        prompt = build_news_impact_prompt(news) + f"\n\nUser question: {req.question}"
        answer = llm.chat(
            "You are a financial assistant analyzing portfolio news impact.",
            prompt,
        )
        return {"route": route, "answer": answer, "data": news}

    result = answer_financial_question(req.question)
    result["route"] = route
    return result

# --- Container Frontend Serving ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = Path("frontend/dist")
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        path = frontend_dist / full_path
        if path.exists() and path.is_file():
            return FileResponse(path)
        return FileResponse(frontend_dist / "index.html")