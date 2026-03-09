def build_portfolio_summary_prompt(summary: dict) -> str:
    return f"""
Portfolio as of {summary['as_of_date']}:
Total value: {summary['total_value']}
Cash: {summary['cash']}
Top holdings: {summary['top_holdings']}
Sector exposure: {summary['sector_exposure']}

Write a concise portfolio summary.
"""


def build_risk_flags_prompt(flags: list, summary: dict) -> str:
    return f"""
Portfolio summary:
{summary}

Detected risk flags:
{flags}

Write a brief risk overview with severity and explanation.
"""


def build_news_impact_prompt(news_impact: dict) -> str:
    return f"""
Portfolio-linked news:
{news_impact}

Summarize which holdings appear most affected and whether the impact seems positive, negative, or mixed.
"""