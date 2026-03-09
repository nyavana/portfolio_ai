def route_query(query: str) -> str:
    q = query.lower()
    if "summary" in q or "allocation" in q or "portfolio" in q:
        return "portfolio_summary"
    if "news" in q or "headline" in q or "impact" in q:
        return "news_impact"
    if "risk" in q or "exposure" in q or "concentration" in q:
        return "risk_flags"
    return "qa"