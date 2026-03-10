from typing import Optional

from core.lmdeploy_client import LMDeployClient
from rag.filings_retriever import FilingsRetriever
from rag.news_retriever import NewsRetriever


def _classify_question(question: str) -> str:
    q = question.lower()

    news_keywords = [
        "news", "headline", "recent", "latest", "impact", "media", "announcement"
    ]
    filings_keywords = [
        "10-k", "10q", "10-q", "annual report", "filing", "risk factors",
        "md&a", "financial statement", "revenue", "profitability", "sec filing"
    ]
    mixed_keywords = [
        "portfolio", "holding", "holdings", "position", "positions",
        "my portfolio", "my holdings"
    ]

    has_news = any(k in q for k in news_keywords)
    has_filings = any(k in q for k in filings_keywords)
    has_mixed = any(k in q for k in mixed_keywords)

    if has_news and not has_filings:
        return "news"
    if has_filings and not has_news:
        return "filings"
    if has_mixed or (has_news and has_filings):
        return "hybrid"
    return "filings"


def _build_context_block(items: list[str], title: str) -> str:
    if not items:
        return f"{title}:\n(no retrieved documents)"
    joined = "\n\n---\n\n".join(items)
    return f"{title}:\n{joined}"


def answer_financial_question(
    question: str,
    llm_client: Optional[LMDeployClient] = None,
) -> dict:
    route = _classify_question(question)
    llm = llm_client or LMDeployClient()

    filings_docs, filings_metas, filings_ids = [], [], []
    news_docs, news_metas, news_ids = [], [], []

    if route in ("filings", "hybrid"):
        filings_docs, filings_metas, filings_ids = FilingsRetriever().retrieve(question, k=4)

    if route in ("news", "hybrid"):
        news_docs, news_metas, news_ids = NewsRetriever().retrieve(question, k=4)

    if route == "news":
        context = _build_context_block(news_docs, "Retrieved news context")
        evidence = news_docs
        metadata = news_metas
        source_ids = news_ids
    elif route == "filings":
        context = _build_context_block(filings_docs, "Retrieved filings context")
        evidence = filings_docs
        metadata = filings_metas
        source_ids = filings_ids
    else:
        context = (
            _build_context_block(filings_docs, "Retrieved filings context")
            + "\n\n"
            + _build_context_block(news_docs, "Retrieved news context")
        )
        evidence = {
            "filings": filings_docs,
            "news": news_docs
        }
        metadata = {
            "filings": filings_metas,
            "news": news_metas
        }
        source_ids = {
            "filings": filings_ids,
            "news": news_ids
        }

    system_prompt = (
        "You are a careful financial assistant. "
        "Use only the provided retrieved evidence. "
        "Do not invent facts. "
        "If evidence is incomplete, say so clearly."
    )

    user_prompt = f"""
{context}

Question:
{question}

Please provide:
1. A direct answer
2. A short evidence summary
3. A short caution if the evidence is incomplete
"""

    answer = llm.chat(system_prompt, user_prompt)

    return {
        "route": route,
        "question": question,
        "answer": answer,
        "evidence": evidence,
        "metadata": metadata,
        "source_ids": source_ids,
    }