"""
ComplyFlow - Vertex AI Embeddings Wrapper

This module provides a LangChain-compatible wrapper for Google Vertex AI embeddings.
It allows semantic search and RAG (Retrieval-Augmented Generation) using text embeddings.

Classes:
- VertexEmbeddings: Minimal wrapper for Vertex AI embedding models.

Note: Requires Google Cloud credentials with Vertex AI API access.
"""

import os
from typing import List

try:
    from google import genai
except Exception:
    genai = None

class VertexEmbeddings:
    """
    Minimal embeddings wrapper that uses Vertex AI via google-genai.
    Provides embed_query() and embed_documents() compatible with LangChain's interface.
    """
    def __init__(self, model: str = "models/embedding-001", project: str | None = None, location: str | None = None):
        if genai is None:
            raise RuntimeError("google-genai library not available")
        self.model = model
        self.project = (
            project
            or os.getenv("DOCAI_PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or os.getenv("GCP_PROJECT")
        )
        self.location = location or os.getenv("VERTEX_LOCATION") or "us-central1"
        if not self.project:
            raise RuntimeError("Set DOCAI_PROJECT_ID/GOOGLE_CLOUD_PROJECT for Vertex embeddings")
        self.client = genai.Client(vertexai=True, project=self.project, location=self.location)

    def _extract_vector(self, resp) -> List[float]:
        # google-genai embed_content responses typically contain an object with 'embedding.values'
        try:
            obj = getattr(resp, "data", None)
            if obj:
                obj = obj[0]
            else:
                obj = resp
            emb = getattr(obj, "embedding", None)
            if emb is None and isinstance(obj, dict):
                emb = obj.get("embedding")
            if emb is None:
                raise ValueError("No embedding found in response")
            values = getattr(emb, "values", None)
            if values is None and isinstance(emb, dict):
                values = emb.get("values")
            if values is None and isinstance(emb, list):
                values = emb
            if values is None:
                raise ValueError("No values found in embedding")
            return list(values)
        except Exception as e:
            raise RuntimeError(f"Failed to parse Vertex embedding response: {e}")

    def embed_query(self, text: str) -> List[float]:
        resp = self.client.models.embed_content(model=self.model, content=text)
        return self._extract_vector(resp)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        vectors: List[List[float]] = []
        for t in texts:
            resp = self.client.models.embed_content(model=self.model, content=t)
            vectors.append(self._extract_vector(resp))
        return vectors
