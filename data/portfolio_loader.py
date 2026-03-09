import json
from app.config import PORTFOLIO_PATH


def load_portfolio() -> dict:
    with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
        return json.load(f)