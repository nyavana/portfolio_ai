from services.portfolio_summary import compute_portfolio_summary


def detect_risk_flags() -> list:
    analysis = compute_portfolio_summary()
    flags = []

    top_holdings = analysis["top_holdings"]
    sector_exposure = analysis["sector_exposure"]
    total_value = analysis["total_value"]
    cash = analysis["cash"]

    for h in top_holdings:
        if h["weight"] > 0.20:
            flags.append({
                "type": "concentration_risk",
                "severity": "high",
                "message": f'{h["ticker"]} accounts for {h["weight"]:.1%} of the portfolio.'
            })

    top3_weight = sum(h["weight"] for h in top_holdings[:3])
    if top3_weight > 0.50:
        flags.append({
            "type": "top3_concentration",
            "severity": "high",
            "message": f"Top 3 holdings account for {top3_weight:.1%} of the portfolio."
        })

    for sector, weight in sector_exposure.items():
        if weight > 0.40:
            flags.append({
                "type": "sector_concentration",
                "severity": "medium",
                "message": f"{sector} exposure is {weight:.1%}."
            })

    cash_ratio = cash / total_value if total_value else 0.0
    if cash_ratio < 0.05:
        flags.append({
            "type": "low_cash_buffer",
            "severity": "low",
            "message": f"Cash is only {cash_ratio:.1%} of the portfolio."
        })

    return flags