import chromadb
from sentence_transformers import SentenceTransformer

from app.config import (
    CHROMA_NEWS_PATH,
    NEWS_COLLECTION,
    EMBED_MODEL_NAME,
)


class NewsRetriever:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=str(CHROMA_NEWS_PATH))
        self.collection = self.client.get_or_create_collection(NEWS_COLLECTION)
        self.embedder = SentenceTransformer(EMBED_MODEL_NAME)

    def retrieve(self, query: str, k: int = 4):
        emb = self.embedder.encode([query], normalize_embeddings=True).tolist()[0]
        result = self.collection.query(query_embeddings=[emb], n_results=k)

        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        ids = result.get("ids", [[]])[0]

        return docs, metas, ids