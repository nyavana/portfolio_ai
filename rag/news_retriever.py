from __future__ import annotations

from typing import Any

import chromadb
from sentence_transformers import SentenceTransformer

from app.config import (
    CHROMA_NEWS_PATH,
    NEWS_COLLECTION,
    EMBED_MODEL_NAME,
)


class NewsRetriever:
    def __init__(self) -> None:
        self.client = chromadb.PersistentClient(path=str(CHROMA_NEWS_PATH))
        self.collection = self.client.get_or_create_collection(NEWS_COLLECTION)
        self._embedder: SentenceTransformer | None = None

    def _get_embedder(self) -> SentenceTransformer:
        if self._embedder is None:
            self._embedder = SentenceTransformer(EMBED_MODEL_NAME)
        return self._embedder

    def retrieve(self, query: str, k: int = 4) -> tuple[list[str], list[dict[str, Any]], list[str]]:
        emb = self._get_embedder().encode([query], normalize_embeddings=True).tolist()[0]
        result = self.collection.query(query_embeddings=[emb], n_results=k)

        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        ids = result.get("ids", [[]])[0]

        normalized_metas = [
            meta if isinstance(meta, dict) else {}
            for meta in metas
        ]

        return docs, normalized_metas, ids

    def list_documents(self) -> list[dict[str, Any]]:
        result = self.collection.get(include=["documents", "metadatas"])
        docs = result.get("documents", [])
        metas = result.get("metadatas", [])
        ids = result.get("ids", [])

        records: list[dict[str, Any]] = []
        for doc_id, text, metadata in zip(ids, docs, metas):
            records.append(
                {
                    "id": str(doc_id),
                    "text": str(text),
                    "metadata": metadata if isinstance(metadata, dict) else {},
                }
            )

        return records
