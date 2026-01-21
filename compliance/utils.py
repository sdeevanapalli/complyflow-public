from google.cloud import documentai
from django.conf import settings

def analyze_document_uri(gcs_uri, mime_type='application/pdf'):
    """
    Tells Google Doc AI to read a file directly from Google Cloud Storage.
    """
    try:
        # 1. Setup the Client with EXPLICIT Credentials
        # This fixes the "Default Credentials not found" error
        client = documentai.DocumentProcessorServiceClient(
            credentials=settings.GS_CREDENTIALS
        )

        # 2. Define the Processor Name
        name = client.processor_path(
            settings.DOCAI_PROJECT_ID,
            settings.DOCAI_LOCATION,
            settings.DOCAI_PROCESSOR_ID
        )

        # 3. Point to the file in the Cloud
        gcs_document = documentai.GcsDocument(
            gcs_uri=gcs_uri,
            mime_type=mime_type
        )

        # 4. Prepare Request
        request = documentai.ProcessRequest(
            name=name,
            gcs_document=gcs_document,
            skip_human_review=True 
        )

        # 5. Execute
        print(f"[AI] Sending GCS Link to AI: {gcs_uri}...")
        
        result = client.process_document(request=request)
        document = result.document
        
        # 6. Extract Data
        extracted_data = {
            "text": document.text[:5000], 
            "entities": []
        }
        
        for entity in document.entities:
            extracted_data["entities"].append({
                "type": entity.type_,
                "value": entity.mention_text,
                "confidence": round(entity.confidence, 2)
            })
            
        print("[AI] Analysis Successful.")
        return extracted_data

    except AttributeError:
        print("[Error] GS_CREDENTIALS not found in settings. Check credentials.json path.")
        return None
    except Exception as e:
        print(f"[Error] AI Error: {e}")
        return None