from __future__ import annotations

from datetime import date
import re
from typing import Any

from data.news_loader import load_news
from data.portfolio_loader import load_portfolio
from rag.news_retriever import NewsRetriever

MAX_NEWS_PER_TICKER = 3

COMPANY_SUFFIX_TOKENS = {
    "co",
    "company",
    "corp",
    "corporation",
    "holdings",
    "inc",
    "incorporated",
    "limited",
    "llc",
    "ltd",
    "plc",
}

GENERIC_ALIAS_TOKENS = {
    "bank",
    "banks",
    "capital",
    "company",
    "corp",
    "corporation",
    "financial",
    "financials",
    "global",
    "group",
    "holdings",
    "inc",
    "international",
    "technologies",
    "technology",
}


def _normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _normalize_alias(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", " ", value.lower())
    return _normalize_spaces(normalized)


def _strip_company_suffixes(name: str) -> str:
    tokens = _normalize_alias(name).split()
    while tokens and tokens[-1] in COMPANY_SUFFIX_TOKENS:
        tokens.pop()
    return " ".join(tokens)


def _build_aliases(ticker: str, name: str) -> list[str]:
    aliases = {ticker.lower()}

    normalized_name = _strip_company_suffixes(name)
    if normalized_name:
        aliases.add(normalized_name)

        first_word = normalized_name.split()[0]
        if len(first_word) > 3 and first_word not in GENERIC_ALIAS_TOKENS:
            aliases.add(first_word)

    return sorted(aliases, key=len, reverse=True)


def _build_alias_pattern(alias: str) -> re.Pattern[str]:
    alias_pattern = re.escape(alias).replace(r"\ ", r"\s+")
    return re.compile(rf"(?<![a-z0-9]){alias_pattern}(?![a-z0-9])")


def _extract_holdings(portfolio: Any) -> list[dict[str, str]]:
    holdings_raw: list[Any]

    if isinstance(portfolio, dict):
        raw_holdings = portfolio.get("holdings", [])
        holdings_raw = raw_holdings if isinstance(raw_holdings, list) else []
    elif isinstance(portfolio, list):
        holdings_raw = portfolio
    else:
        holdings_raw = []

    holdings: list[dict[str, str]] = []
    seen_tickers: set[str] = set()

    for item in holdings_raw:
        if not isinstance(item, dict):
            continue

        ticker_value = item.get("ticker") or item.get("symbol")
        if not ticker_value:
            continue

        ticker = str(ticker_value).upper().strip()
        if not ticker or ticker in seen_tickers:
            continue

        seen_tickers.add(ticker)
        holdings.append(
            {
                "ticker": ticker,
                "name": str(item.get("name") or "").strip(),
            }
        )

    return holdings


def _build_holding_matchers(holdings: list[dict[str, str]]) -> list[dict[str, Any]]:
    matchers: list[dict[str, Any]] = []

    for holding in holdings:
        aliases = _build_aliases(holding["ticker"], holding["name"])
        matchers.append(
            {
                "ticker": holding["ticker"],
                "patterns": [_build_alias_pattern(alias) for alias in aliases],
            }
        )

    return matchers


def _extract_metadata_tickers(metadata: dict[str, Any]) -> set[str]:
    tickers: set[str] = set()

    for key in ("primary_ticker", "ticker", "symbol"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            tickers.add(value.strip().upper())

    for key in ("tickers_csv", "tickers"):
        value = metadata.get(key)
        if isinstance(value, str):
            for ticker in value.split(","):
                normalized = ticker.strip().upper()
                if normalized:
                    tickers.add(normalized)

    return tickers


def _build_display_text(text: str, metadata: dict[str, Any]) -> str:
    title = metadata.get("title")
    if not isinstance(title, str) or not title.strip():
        return _normalize_spaces(text)

    normalized_title = _normalize_spaces(title)
    normalized_text = _normalize_spaces(text)

    if not normalized_text:
        return normalized_title
    if normalized_text.lower().startswith(normalized_title.lower()):
        return normalized_text
    return f"{normalized_title} {normalized_text}"


def _serialize_news_document(text: str, metadata: dict[str, Any]) -> dict[str, Any]:
    document: dict[str, Any] = {"text": text}
    if metadata:
        document["metadata"] = metadata
    return document


def _build_search_text(text: str, metadata: dict[str, Any]) -> str:
    display_text = _build_display_text(text, metadata)
    return _normalize_alias(display_text)


def _parse_sort_date(metadata: dict[str, Any]) -> int | None:
    raw_date = metadata.get("date")
    if not isinstance(raw_date, str) or not raw_date.strip():
        return None

    try:
        return date.fromisoformat(raw_date.strip()).toordinal()
    except ValueError:
        return None


def _sort_documents(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        documents,
        key=lambda document: (
            0 if document["sort_date"] is not None else 1,
            -(document["sort_date"] or 0),
            document["source_order"],
        ),
    )


def _dedupe_documents(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: list[dict[str, Any]] = []
    seen: set[tuple[str, str, int | str]] = set()

    for document in documents:
        metadata = document["metadata"]
        key = (
            document["display_text"].lower(),
            str(metadata.get("source_file", "")),
            metadata.get("row_idx", metadata.get("row_id", document["id"])),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(document)

    return deduped


def _match_tickers(search_text: str, matchers: list[dict[str, Any]]) -> set[str]:
    matched: set[str] = set()

    for matcher in matchers:
        if any(pattern.search(search_text) for pattern in matcher["patterns"]):
            matched.add(matcher["ticker"])

    return matched


def _build_canonical_news_lookup() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    by_id: dict[str, dict[str, Any]] = {}
    by_text: dict[str, dict[str, Any]] = {}

    for item in load_news():
        if not isinstance(item, dict):
            continue

        metadata: dict[str, Any] = {"source_file": "demo_news.json"}
        for key in ("id", "title", "date"):
            value = item.get(key)
            if isinstance(value, str) and value.strip():
                metadata[key] = value.strip()

        tickers = item.get("tickers")
        if isinstance(tickers, list):
            normalized_tickers = [
                str(ticker).strip().upper()
                for ticker in tickers
                if isinstance(ticker, str) and ticker.strip()
            ]
            if normalized_tickers:
                metadata["primary_ticker"] = normalized_tickers[0]
                metadata["tickers_csv"] = ",".join(normalized_tickers)

        text = str(item.get("text") or item.get("content") or item.get("body") or "").strip()
        display_text = _build_display_text(text, metadata)

        item_id = metadata.get("id")
        if isinstance(item_id, str):
            by_id[item_id] = metadata
        if display_text:
            by_text[display_text.lower()] = metadata

    return by_id, by_text


def _enrich_metadata(
    record_id: str,
    text: str,
    metadata: dict[str, Any],
    canonical_by_id: dict[str, dict[str, Any]],
    canonical_by_text: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    canonical_metadata = canonical_by_id.get(record_id)
    if canonical_metadata is None:
        canonical_metadata = canonical_by_text.get(_build_display_text(text, metadata).lower())
    if canonical_metadata is None:
        return metadata

    merged_metadata = dict(canonical_metadata)
    merged_metadata.update(metadata)
    return merged_metadata


def get_news_impact() -> dict[str, Any]:
    holdings = _extract_holdings(load_portfolio())
    retriever = NewsRetriever()
    canonical_by_id, canonical_by_text = _build_canonical_news_lookup()

    raw_documents = retriever.list_documents()
    documents: list[dict[str, Any]] = []
    for source_order, record in enumerate(raw_documents):
        record_id = str(record.get("id") or source_order)
        metadata = record.get("metadata")
        normalized_metadata = metadata if isinstance(metadata, dict) else {}
        text = str(record.get("text") or "").strip()
        if not text:
            continue

        normalized_metadata = _enrich_metadata(
            record_id,
            text,
            normalized_metadata,
            canonical_by_id,
            canonical_by_text,
        )
        display_text = _build_display_text(text, normalized_metadata)
        documents.append(
            {
                "id": record_id,
                "display_text": display_text,
                "metadata": normalized_metadata,
                "search_text": _build_search_text(text, normalized_metadata),
                "sort_date": _parse_sort_date(normalized_metadata),
                "source_order": source_order,
            }
        )

    documents = _sort_documents(_dedupe_documents(documents))

    portfolio_tickers = {holding["ticker"] for holding in holdings}
    matchers = _build_holding_matchers(holdings)

    ticker_news: dict[str, list[dict[str, Any]]] = {
        holding["ticker"]: []
        for holding in holdings
    }
    general_news: list[dict[str, Any]] = []

    for document in documents:
        matched_tickers = _extract_metadata_tickers(document["metadata"]) & portfolio_tickers
        if not matched_tickers:
            matched_tickers = _match_tickers(document["search_text"], matchers)

        serialized_document = _serialize_news_document(
            document["display_text"],
            document["metadata"],
        )

        if len(matched_tickers) == 1:
            ticker = next(iter(matched_tickers))
            if len(ticker_news[ticker]) < MAX_NEWS_PER_TICKER:
                ticker_news[ticker].append(serialized_document)
            continue

        general_news.append(serialized_document)

    return {
        "news_data": [
            {
                "ticker": holding["ticker"],
                "matched_news": ticker_news[holding["ticker"]],
            }
            for holding in holdings
        ],
        "general_news": general_news,
    }
