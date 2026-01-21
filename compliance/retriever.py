"""
ComplyFlow - Legal Document Retriever

This module handles semantic search for legal documents using vector embeddings.
It uses LangChain's PGVector for similarity search with pgvector PostgreSQL extension.

Functions:
- search_laws: Performs semantic search on the legal knowledge base.

Note: Requires PostgreSQL with pgvector extension and Vertex AI embeddings.
"""

import os
from langchain_postgres.vectorstores import PGVector
from dotenv import load_dotenv
from .vertex_embeddings import VertexEmbeddings

load_dotenv()

# --- CONFIGURATION ---
# Use the SAME connection string and model as ingestion
DB_CONNECTION = os.getenv("DATABASE_URL")
embeddings = VertexEmbeddings(model="models/embedding-001")

# Connect to the EXISTING table (langchain_pg_embedding)
vector_store = PGVector(
    embeddings=embeddings,
    collection_name="legal_docs_vectors", # This maps to the internal collection ID
    connection=DB_CONNECTION,
    use_jsonb=True,
)

def search_laws(query, k=3, filter_metadata=None):
    """
    Semantic Search: Finds the top 'k' most relevant legal chunks.
    filter_metadata: Dictionary for filtering, e.g. {"source": "doc.pdf"}
    """
    print(f"🔍 Searching for: '{query}' (Filter: {filter_metadata})...")
    
    # Perform Similarity Search with filtering
    # Langchain PGVector supports filtering via the 'filter' parameter
    docs = vector_store.similarity_search(query, k=k, filter=filter_metadata)
    
    results = []
    for doc in docs:
        results.append({
            "content": doc.page_content,
            "source": doc.metadata.get("source", "Unknown"),
            "category": doc.metadata.get("category", "Unknown")
        })
        
    return results

# --- TEST IT ---
if __name__ == "__main__":
    # Test with your Golden Question
    test_query = "I purchased raw materials for my factory and received the invoice on 25th August 2024. However, due to a logistics delay, the goods were delivered in three separate lots. The first lot arrived on 28th August, the second on 5th September, and the last lot on 15th September 2024. Can I claim the Input Tax Credit (ITC) for this invoice in my GSTR-3B return for August 2024?"
    answers = search_laws(test_query)
    
    print("\n--- RESULTS ---")
    for i, ans in enumerate(answers):
        print(f"Result {i+1} [{ans['source']}]:\n{ans['content'][:200]}...\n")