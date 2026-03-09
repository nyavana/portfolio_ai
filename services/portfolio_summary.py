from collections import defaultdict
from data.portfolio_loader import load_portfolio


def compute_portfolio_summary() -> dict:
    data = load_portfolio()
    holdings = data["holdings"]
    cash = float(data.get("cash", 0.0))

    total_equity_value = 0.0
    for h in holdings:
        h["market_value"] = h["quantity"] * h["price"]
        h["cost_value"] = h["quantity"] * h["avg_cost"]
        h["unrealized_pnl"] = h["market_value"] - h["cost_value"]
        total_equity_value += h["market_value"]

    total_value = total_equity_value + cash

    for h in holdings:
        h["weight"] = h["market_value"] / total_value if total_value else 0.0

    sector_exposure = defaultdict(float)
    asset_class_exposure = defaultdict(float)

    for h in holdings:
        sector_exposure[h["sector"]] += h["market_value"]
        asset_class_exposure[h["asset_class"]] += h["market_value"]

    sector_exposure = {k: round(v / total_value, 4) for k, v in sector_exposure.items()}
    asset_class_exposure = {k: round(v / total_value, 4) for k, v in asset_class_exposure.items()}

    top_holdings = sorted(holdings, key=lambda x: x["market_value"], reverse=True)[:5]

    return {
        "user_id": data["user_id"],
        "as_of_date": data["as_of_date"],
        "cash": cash,
        "total_value": round(total_value, 2),
        "top_holdings": top_holdings,
        "sector_exposure": sector_exposure,
        "asset_class_exposure": asset_class_exposure,
        "holdings": holdings
    }