from __future__ import annotations

import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from ingest.index_news import _add_scalar_metadata, read_json


class IndexNewsTests(unittest.TestCase):
    def test_read_json_merges_title_and_body(self) -> None:
        with TemporaryDirectory() as temp_dir:
            news_path = Path(temp_dir) / "demo_news.json"
            news_path.write_text(
                json.dumps(
                    [
                        {
                            "id": "news_001",
                            "title": "Apple faces slowing iPhone demand in key markets",
                            "text": "Analysts noted weaker demand trends for iPhone sales in several international markets.",
                            "tickers": ["AAPL"],
                        }
                    ]
                ),
                encoding="utf-8",
            )

            rows = read_json(news_path)

        self.assertEqual(
            rows,
            [
                {
                    "text": "Apple faces slowing iPhone demand in key markets Analysts noted weaker demand trends for iPhone sales in several international markets.",
                    "source_file": "demo_news.json",
                    "row_id": 0,
                    "id": "news_001",
                    "title": "Apple faces slowing iPhone demand in key markets",
                    "tickers": ["AAPL"],
                }
            ],
        )

    def test_add_scalar_metadata_serializes_ticker_lists(self) -> None:
        metadata: dict[str, object] = {}

        _add_scalar_metadata(metadata, "tickers", ["AAPL", "NVDA"])
        _add_scalar_metadata(metadata, "date", "2026-03-08")

        self.assertEqual(
            metadata,
            {
                "primary_ticker": "AAPL",
                "tickers_csv": "AAPL,NVDA",
                "date": "2026-03-08",
            },
        )


if __name__ == "__main__":
    unittest.main()
