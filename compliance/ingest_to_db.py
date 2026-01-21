"""
ComplyFlow - Document Ingestion Pipeline

This module handles the ingestion of legal documents into the vector database.
It processes PDFs, chunks text, generates embeddings, and stores them in PostgreSQL with pgvector.

Functions:
- ingest_single_file: Process and ingest a single document file.
- clean_text: Clean and normalize document text.
- get_splitter: Get appropriate text splitter based on document type.

Note: Requires PostgreSQL with pgvector and Vertex AI embeddings.
"""

# ingest_to_db.py (Updated to be modular)
import os
import re
from functools import lru_cache
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres.vectorstores import PGVector
from dotenv import load_dotenv
from .vertex_embeddings import VertexEmbeddings

load_dotenv()
DB_CONNECTION = os.getenv("DATABASE_URL")
COLLECTION_NAME = "legal_docs_vectors"
@lru_cache(maxsize=1)
def get_embeddings():
    return VertexEmbeddings(model=os.getenv("VERTEX_EMBEDDING_MODEL", "models/embedding-001"))

def clean_text(text):
    text = re.sub(r'Page \d+ of \d+', '', text)
    return re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)

def get_splitter(doc_type):
    # (Keep your existing splitter logic here, simplified for brevity)
    if doc_type == "acts":
        return RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    else:
        return RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

def ingest_single_file(file_path, category, source_url=None):
    """
    Process a SINGLE file and add it to Supabase.
    Called by the Live Watcher.
    """
    print(f"[Ingest] Ingesting Live File: {file_path}")
    try:
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        full_text = clean_text("\n".join([p.page_content for p in pages]))
        
        splitter = get_splitter(category)
        chunks = splitter.create_documents([full_text])
        
        # Add Metadata (Crucial for tracking live files)
        for chunk in chunks:
            chunk.metadata["source"] = os.path.basename(file_path)
            chunk.metadata["category"] = category
            if source_url:
                chunk.metadata["source_url"] = source_url # To prevent re-downloading later
        
        if not chunks: return

        PGVector.from_documents(
            embedding=get_embeddings(),
            documents=chunks,
            collection_name=COLLECTION_NAME,
            connection=DB_CONNECTION,
            use_jsonb=True,
        )
        print(f"[Done] Successfully added to Knowledge Base!")
        
    except Exception as e:
        print(f"[Error] Error ingesting {file_path}: {e}")