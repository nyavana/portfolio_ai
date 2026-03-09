import json
import csv
from pathlib import Path


def read_txt(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    return [{"text": text, "source_file": path.name}]


def read_json(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))

    if isinstance(data, list):
        rows = []
        for i, item in enumerate(data):
            if isinstance(item, dict):
                text = item.get("text") or item.get("content") or item.get("body") or ""
                rows.append({
                    "text": text,
                    "source_file": path.name,
                    "row_id": i,
                    **{k: v for k, v in item.items() if k != "text"}
                })
        return rows

    if isinstance(data, dict):
        text = data.get("text") or data.get("content") or data.get("body") or json.dumps(data)
        return [{"text": text, "source_file": path.name, **data}]

    return []


def read_csv(path: Path) -> list[dict]:
    rows = []
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            text = row.get("text") or row.get("content") or row.get("body") or row.get("title", "")
            if row.get("summary"):
                text = f"{text}\n{row['summary']}"
            rows.append({
                "text": text,
                "source_file": path.name,
                "row_id": i,
                **row
            })
    return rows


def parse_file(path: str) -> list[dict]:
    p = Path(path)
    suffix = p.suffix.lower()

    if suffix == ".txt":
        return read_txt(p)
    if suffix == ".json":
        return read_json(p)
    if suffix == ".csv":
        return read_csv(p)

    raise ValueError(f"Unsupported file type: {suffix}")