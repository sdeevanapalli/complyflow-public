from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.db import connection
from .models import TaxDocument
from .utils import analyze_document_uri
import time
import json
from google.cloud import storage
from .vertex_embeddings import VertexEmbeddings
from .agent_logic import audit_invoice_against_rule

# ==========================================
# 0. SETUP AI MODEL (CRITICAL STEP)
# ==========================================
import os
_embedding_model = None

def get_embedding_model():
    """Lazy-init Vertex embeddings to avoid build-time env issues."""
    global _embedding_model
    if _embedding_model is not None:
        return _embedding_model
    project = os.getenv("DOCAI_PROJECT_ID")
    if not project:
        print("[AI] Skipping embedding init: DOCAI_PROJECT_ID not set.")
        return None
    try:
        _embedding_model = VertexEmbeddings(model="models/embedding-001", project=project, location=os.getenv("VERTEX_LOCATION") or "us-central1")
        print("[AI] Embedding model initialized (Vertex embedding-001).")
        return _embedding_model
    except Exception as e:
        print(f"[AI] Vertex embeddings init failed: {e}")
        return None

# ==========================================
# 1. HELPER: Vector Search in Supabase
# ==========================================
def find_relevant_rule(query_text):
    """
    Converts text -> Vector and searches your 'langchain_pg_embedding' table.
    """
    try:
        # A. Create Vector
        model = get_embedding_model()
        if model is None:
            return None
        query_vector = model.embed_query(query_text)
        
        # B. Raw SQL Search
        sql = """
            SELECT embedding.document, embedding.cmetadata
            FROM langchain_pg_embedding AS embedding
            JOIN langchain_pg_collection AS collection 
              ON embedding.collection_id = collection.uuid
            WHERE collection.name = 'legal_docs_vectors'
            ORDER BY embedding.embedding <=> %s::vector
            LIMIT 2;
        """
        
        with connection.cursor() as cursor:
            cursor.execute(sql, [query_vector])
            rows = cursor.fetchall()
            
        if rows:
            combined_text = ""
            sources = []
            for row in rows:
                combined_text += f"\n--- Source: {row[1].get('source', 'Unknown')} ---\n{row[0]}\n"
                sources.append(row[1].get('source', 'Unknown'))
            
            return {"text": combined_text, "metadata": {"source": ", ".join(list(set(sources)))}}
        
        return None
        
    except Exception as e:
        print(f"[Error] Vector Search Error: {e}")
        return None

# ==========================================
# 2. HELPER: Verification Logic
# ==========================================
def verify_billing_logic(extracted_data):
    # 1. Extract Key Data
    doc_text_preview = extracted_data.get('text', '')[:200].replace('\n', ' ')
    
    tax_amount = 0.0
    subtotal = 0.0
    is_financial_doc = False
    
    for entity in extracted_data.get('entities', []):
        if entity['type'] == 'total_tax_amount':
            try:
                tax_amount = float(entity['value'].replace('$','').replace(',',''))
                is_financial_doc = True
            except: pass
        elif entity['type'] == 'net_amount':
             try:
                subtotal = float(entity['value'].replace('$','').replace(',',''))
             except: pass

    # 1.1 Category Detection for better search
    keywords = []
    text_lower = doc_text_preview.lower()
    if 'gift' in text_lower or 'watch' in text_lower:
        keywords.append("Corporate Gift")
    if 'itc' in text_lower or 'input tax' in text_lower:
        keywords.append("ITC Restricted Items")
    if 'export' in text_lower:
        keywords.append("Export of Services")
    
    category_context = " ".join(keywords)

    # 2. CONSTRUCT DYNAMIC QUERY
    if is_financial_doc:
        search_query = f"GST rules and ITC restrictions for {category_context} {doc_text_preview[:100]}"
    else:
        search_query = f"CBIC rules regarding {category_context} {doc_text_preview[:100]}"

    print(f"[Search] Searching Knowledge Base for: '{search_query[:50]}...'")
    
    # 3. SEMANTIC SEARCH
    rule_match = find_relevant_rule(search_query)
    
    if not rule_match:
        return "Warning: No relevant CBIC rules found in the database."

    # 4. VERIFICATION DECISION
    found_text = rule_match['text']
    source_doc = rule_match['metadata'].get('source', 'Unknown Source') 
    
    print(f"[Match] Matched Rule from: {source_doc}")
    print(f"[Match] Rule Context: {found_text[:200]}...")

    if is_financial_doc:
        # MODE A: FINANCIAL (Invoice) - USE AI AUDIT
        is_flagged, reason = audit_invoice_against_rule(extracted_data, found_text)
        if is_flagged:
            return f"Compliance Infringement: {reason} (Ref: {source_doc})"
        return None 
    else:
        # MODE B: GENERAL COMPLIANCE (Memo/Notice)
        return f"Reference Found: This document relates to '{source_doc}'. Verification Context: {found_text[:100]}..."

# ==========================================
# 3. UTILS: Storage Check
# ==========================================
def check_blob_exists(bucket_name, blob_name):
    storage_client = storage.Client(credentials=settings.GS_CREDENTIALS)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.exists()

# ==========================================
# 4. SIGNAL: The Main Trigger
# ==========================================
@receiver(post_save, sender=TaxDocument)
def process_tax_document(sender, instance, created, **kwargs):
    if created and instance.file:
        try:
            print(f"[Wait] Waiting for file: {instance.file.name}")
            file_ready = False
            for i in range(3):
                if check_blob_exists(settings.GS_BUCKET_NAME, instance.file.name):
                    file_ready = True
                    break
                time.sleep(2)
            
            if not file_ready:
                instance.status = 'ERROR'
                instance.flag_reason = "File upload incomplete"
                instance.save()
                return

            gcs_uri = f"gs://{settings.GS_BUCKET_NAME}/{instance.file.name}"
            ai_results = analyze_document_uri(gcs_uri)
            
            if ai_results:
                notification = verify_billing_logic(ai_results)
                instance.status = 'FLAGGED' if notification else 'VALID'
                instance.flag_reason = notification
                instance.is_processed = True
                instance.save(update_fields=['status', 'flag_reason', 'is_processed'])
                print(f"[Done] Final Status: {instance.status}")
                
            else:
                instance.status = 'ERROR'
                instance.save()
                
        except Exception as e:
            print(f"[Error] Signal Error: {e}")