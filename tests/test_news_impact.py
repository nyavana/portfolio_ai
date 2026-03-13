from __future__ import annotations

import unittest
from unittest.mock import patch

from services import news_impact


class StubRetriever:
    def __init__(self, documents: list[dict[str, object]]) -> None:
        self._documents = documents

    def list_documents(self) -> list[dict[str, object]]:
        return self._documents


class NewsImpactTests(unittest.TestCase):
    def test_get_news_impact_assigns_ticker_specific_and_general_news(self) -> None:
        documents = [
            {
                "id": "news_001",
                "text": "Apple faces slowing iPhone demand in key markets Analysts noted weaker demand trends for iPhone sales in several international markets, which may pressure near-term revenue growth.",
                "metadata": {},
            },
            {
                "id": "news_002",
                "text": "NVIDIA expands AI chip partnerships with major cloud providers NVIDIA announced expanded AI infrastructure partnerships, which could support future data center revenue growth.",
                "metadata": {},
            },
            {
                "id": "news_003",
                "text": "Banks may face tighter capital requirements Regulators are discussing possible higher capital requirements for large banks, which could weigh on profitability.",
                "metadata": {},
            },
            {
                "id": "uploaded_nvda",
                "text": "Recent market news suggests that demand for AI chips remains robust as enterprises accelerate model training and inference deployment. NVIDIA and other semiconductor firms benefited from optimistic spending expectations tied to data center expansion.",
                "metadata": {"source_file": "news_ai_chip_demand_mock.txt"},
            },
            {
                "id": "uploaded_macro",
                "text": "Broader market news highlighted renewed macroeconomic uncertainty, including concerns about interest rates and slowing consumer demand in selected regions.",
                "metadata": {"source_file": "news_macro_risk_mock.txt"},
            },
            {
                "id": "uploaded_cross",
                "text": "Apple and NVIDIA both face fresh scrutiny over AI infrastructure spending and hardware pricing.",
                "metadata": {"source_file": "news_cross_ticker_mock.txt"},
            },
        ]

        with patch.object(
            news_impact,
            "load_portfolio",
            return_value={
                "holdings": [
                    {"ticker": "AAPL", "name": "Apple Inc."},
                    {"ticker": "NVDA", "name": "NVIDIA Corporation"},
                    {"ticker": "JPM", "name": "JPMorgan Chase & Co."},
                ]
            },
        ), patch.object(
            news_impact,
            "load_news",
            return_value=[
                {
                    "id": "news_001",
                    "date": "2026-03-08",
                    "title": "Apple faces slowing iPhone demand in key markets",
                    "text": "Analysts noted weaker demand trends for iPhone sales in several international markets, which may pressure near-term revenue growth.",
                    "tickers": ["AAPL"],
                },
                {
                    "id": "news_002",
                    "date": "2026-03-08",
                    "title": "NVIDIA expands AI chip partnerships with major cloud providers",
                    "text": "NVIDIA announced expanded AI infrastructure partnerships, which could support future data center revenue growth.",
                    "tickers": ["NVDA"],
                },
                {
                    "id": "news_003",
                    "date": "2026-03-07",
                    "title": "Banks may face tighter capital requirements",
                    "text": "Regulators are discussing possible higher capital requirements for large banks, which could weigh on profitability.",
                    "tickers": ["JPM"],
                },
            ],
        ), patch.object(
            news_impact,
            "NewsRetriever",
            return_value=StubRetriever(documents),
        ):
            result = news_impact.get_news_impact()

        news_by_ticker = {
            item["ticker"]: item["matched_news"]
            for item in result["news_data"]
        }

        self.assertEqual(
            [item["text"] for item in news_by_ticker["AAPL"]],
            [
                "Apple faces slowing iPhone demand in key markets Analysts noted weaker demand trends for iPhone sales in several international markets, which may pressure near-term revenue growth."
            ],
        )
        self.assertEqual(
            [item["text"] for item in news_by_ticker["NVDA"]],
            [
                "NVIDIA expands AI chip partnerships with major cloud providers NVIDIA announced expanded AI infrastructure partnerships, which could support future data center revenue growth.",
                "Recent market news suggests that demand for AI chips remains robust as enterprises accelerate model training and inference deployment. NVIDIA and other semiconductor firms benefited from optimistic spending expectations tied to data center expansion.",
            ],
        )
        self.assertEqual(
            [item["text"] for item in news_by_ticker["JPM"]],
            [
                "Banks may face tighter capital requirements Regulators are discussing possible higher capital requirements for large banks, which could weigh on profitability."
            ],
        )

        self.assertEqual(
            [item["text"] for item in result["general_news"]],
            [
                "Broader market news highlighted renewed macroeconomic uncertainty, including concerns about interest rates and slowing consumer demand in selected regions.",
                "Apple and NVIDIA both face fresh scrutiny over AI infrastructure spending and hardware pricing.",
            ],
        )

    def test_get_news_impact_caps_each_ticker_bucket(self) -> None:
        documents = [
            {
                "id": f"doc_{index}",
                "text": f"NVIDIA update {index}",
                "metadata": {"date": f"2026-03-0{index + 1}", "source_file": f"news_{index}.txt"},
            }
            for index in range(5)
        ]

        with patch.object(
            news_impact,
            "load_portfolio",
            return_value={"holdings": [{"ticker": "NVDA", "name": "NVIDIA Corporation"}]},
        ), patch.object(
            news_impact,
            "load_news",
            return_value=[],
        ), patch.object(
            news_impact,
            "NewsRetriever",
            return_value=StubRetriever(documents),
        ):
            result = news_impact.get_news_impact()

        self.assertEqual(
            len(result["news_data"][0]["matched_news"]),
            news_impact.MAX_NEWS_PER_TICKER,
        )


if __name__ == "__main__":
    unittest.main()
