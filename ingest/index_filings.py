import csv
import json
import re
import uuid
from pathlib import Path
from typing import Any

import chromadb
from sentence_transformers import SentenceTransformer

from app.config import (
    CHROMA_FILINGS_PATH,
    FILINGS_COLLECTION,
    EMBED_MODEL_NAME,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
)


def normalize_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
    text = normalize_text(text)
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    n = len(text)

    while start < n:
        end = min(start + chunk_size, n)
        if end < n:
            last_space = text.rfind(" ", start, end)
            if last_space > start + int(chunk_size * 0.6):
                end = last_space

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= n:
            break

        start = max(end - overlap, start + 1)

    return chunks


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

    raise ValueError(f"Unsupported file type for filings ingestion: {suffix}")


def _get_collection():
    client = chromadb.PersistentClient(path=str(CHROMA_FILINGS_PATH))
    collection = client.get_or_create_collection(FILINGS_COLLECTION)
    return collection


def _delete_existing_file_docs(collection, source_file: str):
    try:
        res = collection.get(where={"source_file": source_file})
        ids = res.get("ids", [])
        if ids:
            collection.delete(ids=ids)
    except Exception:
        pass


def index_one_file(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {path}")

    rows = parse_file(str(p))
    collection = _get_collection()
    embedder = SentenceTransformer(EMBED_MODEL_NAME)

    _delete_existing_file_docs(collection, p.name)

    all_docs = []
    all_ids = []
    all_metas = []

    for row_idx, row in enumerate(rows):
        text = row.get("text", "")
        chunks = chunk_text(text)

        for chunk_idx, chunk in enumerate(chunks):
            meta = {
                "source_file": p.name,
                "doc_type": "filing",
                "row_idx": row_idx,
                "chunk_idx": chunk_idx,
            }

            for k, v in row.items():
                if k != "text" and isinstance(v, (str, int, float, bool)):
                    meta[k] = v

            all_docs.append(chunk)
            all_ids.append(str(uuid.uuid4()))
            all_metas.append(meta)

    if all_docs:
        embeddings = embedder.encode(all_docs, normalize_embeddings=True).tolist()
        collection.add(
            ids=all_ids,
            documents=all_docs,
            metadatas=all_metas,
            embeddings=embeddings
        )

    return {
        "status": "ok",
        "file": str(p),
        "source_file": p.name,
        "chunks_indexed": len(all_docs),
        "rows_parsed": len(rows),
        "collection": FILINGS_COLLECTION,
    }


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to the filing file to index")
    args = parser.parse_args()

    result = index_one_file(args.file)
    print(result)


if __name__ == "__main__":
    main()