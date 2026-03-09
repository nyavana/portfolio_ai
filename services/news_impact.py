from __future__ import annotations

from typing import Any, Dict, List

from data.portfolio_loader import load_portfolio
from rag.news_retriever import NewsRetriever


def _extract_ticker_list(portfolio: Any) -> List[str]:
    if isinstance(portfolio, dict):
        # 常见格式：{"holdings": [...]}
        holdings = portfolio.get("holdings", [])
        if isinstance(holdings, list):
            tickers = []
            for item in holdings:
                if isinstance(item, dict):
                    t = item.get("ticker") or item.get("symbol")
                    if t:
                        tickers.append(str(t))
            return tickers

        # 兜底：直接把 dict value 当 holdings
        tickers = []
        for _, value in portfolio.items():
            if isinstance(value, dict):
                t = value.get("ticker") or value.get("symbol")
                if t:
                    tickers.append(str(t))
        return tickers

    if isinstance(portfolio, list):
        tickers = []
        for item in portfolio:
            if isinstance(item, dict):
                t = item.get("ticker") or item.get("symbol")
                if t:
                    tickers.append(str(t))
        return tickers

    return []


def _normalize_retrieve_output(result: Any) -> List[Dict[str, Any]]:
    """
    统一把 retriever.retrieve(...) 的输出转成：
    [
      {
        "text": "...",
        "metadata": {...}
      },
      ...
    ]
    """
    normalized: List[Dict[str, Any]] = []

    # 情况 1：返回 (docs, metas)
    if isinstance(result, tuple) and len(result) == 2:
        docs, metas = result
        if isinstance(docs, list):
            for i, doc in enumerate(docs):
                meta = metas[i] if isinstance(metas, list) and i < len(metas) else {}
                normalized.append(
                    {
                        "text": str(doc),
                        "metadata": meta if isinstance(meta, dict) else {},
                    }
                )
        return normalized

    # 情况 2：返回 list
    if isinstance(result, list):
        for item in result:
            # list[dict]
            if isinstance(item, dict):
                text = (
                    item.get("text")
                    or item.get("content")
                    or item.get("page_content")
                    or ""
                )
                metadata = item.get("metadata", {})
                normalized.append(
                    {
                        "text": str(text),
                        "metadata": metadata if isinstance(metadata, dict) else {},
                    }
                )
                continue

            # list[(doc, meta)]
            if isinstance(item, tuple) and len(item) >= 2:
                doc, meta = item[0], item[1]
                normalized.append(
                    {
                        "text": str(doc),
                        "metadata": meta if isinstance(meta, dict) else {},
                    }
                )
                continue

            # list[Document] 或其他对象
            text = getattr(item, "page_content", None)
            metadata = getattr(item, "metadata", {})
            if text is None:
                text = str(item)
            normalized.append(
                {
                    "text": str(text),
                    "metadata": metadata if isinstance(metadata, dict) else {},
                }
            )
        return normalized

    # 情况 3：单个对象
    text = getattr(result, "page_content", None)
    metadata = getattr(result, "metadata", {})
    if text is None:
        text = str(result)

    normalized.append(
        {
            "text": str(text),
            "metadata": metadata if isinstance(metadata, dict) else {},
        }
    )
    return normalized


def get_news_impact() -> List[Dict[str, Any]]:
    portfolio = load_portfolio()
    tickers = _extract_ticker_list(portfolio)
    retriever = NewsRetriever()

    results: List[Dict[str, Any]] = []

    for ticker in tickers:
        raw = retriever.retrieve(f"recent news about {ticker}", k=3)
        normalized_docs = _normalize_retrieve_output(raw)

        results.append(
            {
                "ticker": ticker,
                "matched_news": normalized_docs,
            }
        )

    return results