import json
from app.config import NEWS_PATH


def load_news() -> list:
    with open(NEWS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)