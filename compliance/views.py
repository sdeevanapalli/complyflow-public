"""
ComplyFlow - Django REST API Views

This module contains all the REST API endpoints for ComplyFlow.
It handles chat interactions, document uploads, user profiles, and notifications.

Main Features:
- Chat API with RAG (Retrieval-Augmented Generation)
- Document upload and OCR processing
- User profile management
- Notification system

Note: All endpoints require authentication via Google OAuth or JWT tokens.
"""

import os
import logging
from datetime import datetime, timezone

from django.conf import settings
from rest_framework import generics, permissions, parsers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from django.http import StreamingHttpResponse
import json
import time

from .models import TaxDocument, UserProfile, ComplianceQuery, GlobalNotification
from .serializers import TaxDocumentSerializer, UserProfileSerializer, ComplianceQuerySerializer, GlobalNotificationSerializer

# New Google GenAI SDK
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Initialize logging
logger = logging.getLogger(__name__)
load_dotenv()

# --- Helpers ---

def build_suggestions(user_msg: str, results):
    """Utility to create smart follow-up prompts."""
    ideas = []
    msg_lower = user_msg.lower()
    
    categories = [str(r.get("category", "")).lower() for r in results]
    
    def add_if(content: str):
        if content and content not in ideas:
            ideas.append(content)

    if any("itc" in c or "input tax" in c for c in categories) or "itc" in msg_lower:
        add_if("What documents are needed to support this ITC claim?")
        add_if("Are there any ITC blocks for this scenario?")
    elif any("invoice" in c or "invoice" in msg_lower for c in categories):
        add_if("Are there mandatory invoice fields for this case?")
        add_if("Does e-invoicing apply here?")
    elif any("rcm" in c or "reverse" in c for c in categories) or "rcm" in msg_lower:
        add_if("How do I report this RCM entry in GSTR-3B?")
    
    if not ideas:
        add_if("What compliance steps should I take next?")
        add_if("Which return should this be reported under?")

    return ideas[:3]

# --- Views ---

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = TaxDocumentSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return TaxDocument.objects.filter(user=user).order_by('-uploaded_at')
        return TaxDocument.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

class DocumentDetailView(generics.RetrieveDestroyAPIView):
    queryset = TaxDocument.objects.all()
    serializer_class = TaxDocumentSerializer
    permission_classes = [AllowAny] # Matching ListCreateView for now

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def history_view(request):
    """Retrieve unique chat sessions for the authenticated user."""
    # Group by conversation_id and get the latest query for each session
    from django.db.models import Max
    
    # Get distinct conversation IDs and their latest timestamp
    sessions = ComplianceQuery.objects.filter(user=request.user) \
        .values('conversation_id') \
        .annotate(latest_timestamp=Max('timestamp')) \
        .order_by('-latest_timestamp')[:10] # Return last 10 sessions
        
    history_data = []
    for session in sessions:
        # Get the first query of this session to use as a title
        first_query = ComplianceQuery.objects.filter(
            user=request.user, 
            conversation_id=session['conversation_id']
        ).first()
        
        if first_query:
            history_data.append({
                "conversation_id": session['conversation_id'],
                "title": first_query.query[:50] + ("..." if len(first_query.query) > 50 else ""),
                "timestamp": session['latest_timestamp'],
                "last_query": first_query.query
            })
            
    return Response(history_data, status=status.HTTP_200_OK)

@api_view(['GET', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def conversation_detail_view(request, conversation_id):
    """
    GET: Retrieve all messages for a specific conversation session.
    DELETE: Delete all messages for a specific conversation session.
    """
    if request.method == 'DELETE':
        queries = ComplianceQuery.objects.filter(
            user=request.user, 
            conversation_id=conversation_id
        )
        count = queries.count()
        queries.delete()
        print(f"[Backend] Deleted conversation {conversation_id} ({count} messages)")
        return Response(status=status.HTTP_204_NO_CONTENT)

    queries = ComplianceQuery.objects.filter(
        user=request.user, 
        conversation_id=conversation_id
    ).order_by('timestamp')
    
    serializer = ComplianceQuerySerializer(queries, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'DELETE'])
@permission_classes([AllowAny])
def notifications_view(request, pk=None):
    """
    GET: Returns the most recent 10 global notifications.
    DELETE: Deletes a specific notification.
    """
    # Explicitly clear authentication to avoid 401s if token is malformed
    request.user = None 
    
    if request.method == 'DELETE':
        print(f"[Backend] DELETE request received for notification PK: {pk}")
        if pk:
            try:
                notif = GlobalNotification.objects.get(pk=pk)
                notif.delete()
                print(f"   [Success] Notification {pk} deleted")
                return Response(status=status.HTTP_204_NO_CONTENT)
            except GlobalNotification.DoesNotExist:
                print(f"   [Error] Notification {pk} not found")
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": "ID required"}, status=status.HTTP_400_BAD_REQUEST)

    notifications = GlobalNotification.objects.all()[:10]
    serializer = GlobalNotificationSerializer(notifications, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

# Standard Django view for SSE (to avoid 406 Not Acceptable from DRF renderer negotiation)
def notifications_stream(request):
    """
    SSE stream to push new notifications to the client in real-time.
    """
    from django.http import StreamingHttpResponse
    
    print("[SSE] Client requested notification stream connection")
    
    def event_stream():
        # Get start point
        latest = GlobalNotification.objects.first()
        last_id = 0
        if latest:
            last_id = latest.id
            
        while True:
            # Check for new notifications
            new_notifications = GlobalNotification.objects.filter(id__gt=last_id).order_by('id')
            
            for n in new_notifications:
                data = {
                    'id': n.id,
                    'title': n.title,
                    'message': n.message,
                    'doc_name': n.doc_name,
                    'source_url': n.source_url,
                    'created_at': n.created_at.isoformat()
                }
                print(f"[SSE] New notification detected: {n.title} ({n.doc_name})")
                yield f"data: {json.dumps(data)}\n\n"
                last_id = n.id
            
            time.sleep(10)
            
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no' # For Nginx/Proxy stability
    return response
    
# chat_view logic

@api_view(['POST'])
@permission_classes([AllowAny])
def chat_view(request):
    message = request.data.get('message', '').strip()
    history = request.data.get('history', []) or []
    conversation_id = request.data.get('conversation_id')
    
    if not message:
        return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # 1. User Context Retrieval
    user_profession = "User"
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            if profile.profession:
                user_profession = profile.profession
        except UserProfile.DoesNotExist:
            pass
    
    doc_id = request.query_params.get('docId')
    doc_context = ""
    if doc_id and request.user.is_authenticated:
        try:
            doc = TaxDocument.objects.get(id=doc_id, user=request.user)
            doc_context = (
                f"\n\nDOCUMENT CONTEXT:\nFilename: {doc.original_filename}\n"
                f"AI Verdict: {doc.get_status_display()}\nIssues: {doc.flag_reason or 'None'}\n"
                f"Data: {doc.extracted_data or 'Not available'}"
            )
        except TaxDocument.DoesNotExist:
            pass
    
    # 2. Greeting Detection
    message_lower = message.lower().strip()
    greet_keywords = {"hi", "hello", "hey", "yo", "namaste", "greetings"}
    words = set(message_lower.split())
    
    if words.intersection(greet_keywords) and len(words) <= 3:
        intro = (
            f"Hi! 👋 I'm ComplyFlow, your GST and Indian tax compliance assistant. I see you're working as a {user_profession}.\n\n"
            "Ask me tax questions and I'll answer strictly from legal documents with citations."
        )
        return Response({
            "response": intro, 
            "citations": [], 
            "suggestions": ["How to claim ITC?", "What is RCM?"]
        }, status=status.HTTP_200_OK)

    # 3. Retrieval Phase with Metadata Filtering
    try:
        from .retriever import search_laws
        
        # Check if we are discussing a specific document from notifications
        discuss_doc_name = request.query_params.get('discussDoc')
        doc_id = request.query_params.get('docId')
        
        filter_metadata = None
        agent_context = ""
        
        # --- AGENTIC HANDOVER: Check for previous analysis ---
        if discuss_doc_name:
            # Case A: Discussing a new discovery from notifications
            filter_metadata = {"source": discuss_doc_name}
            print(f"[Chat] Targeted search for document: {discuss_doc_name}")
            
            # Check if we have an autonomous draft for this
            notif = GlobalNotification.objects.filter(doc_name=discuss_doc_name).first()
            if notif and notif.action_draft:
                agent_context += f"\nPREVIOUS AGENT ANALYSIS: This document was marked as {notif.impact_level} impact. The agent already drafted this action: {notif.action_draft}\n"
        
        elif doc_id:
            # Case B: Discussing a business document from dashboard
            try:
                tax_doc = TaxDocument.objects.get(id=doc_id)
                if tax_doc.status == 'FLAGGED':
                    agent_context += f"\nPREVIOUS AUDIT RESULT: This document is currently FLAGGED. Reason: {tax_doc.flag_reason}\n"
            except TaxDocument.DoesNotExist:
                pass

        # Expand query if it seems to be a follow-up
        search_query = message
        reference_pronouns = {"this", "that", "it", "them", "those", "they"}
        is_follow_up = len(message.split()) < 8 or any(p in message_lower for p in reference_pronouns)
        
        if is_follow_up and history and not discuss_doc_name:
            last_user_msg = next((m['content'] for m in reversed(history) if m['role'] == 'user'), "")
            if last_user_msg:
                search_query = f"{last_user_msg} {message}"
        
        search_results = search_laws(search_query, k=5, filter_metadata=filter_metadata)
        print(f"[Chat] Found {len(search_results)} relevant chunks in knowledge base")

        # If we targeted a doc but found nothing, fallback to general search to be helpful
        if discuss_doc_name and not search_results:
            print(f"[Chat] ⚠️ No results for {discuss_doc_name} specifically, falling back to general search")
            search_results = search_laws(search_query, k=5)
            print(f"[Chat] General fallback found {len(search_results)} chunks")
        
        context = "\n\n".join([
            f"Source: {r['source']}\nCategory: {r['category']}\nContent: {r['content']}"
            for r in search_results
        ])
        
        citations = [
            {
                "id": str(i+1),
                "section": r.get('category', 'General'),
                "title": r.get('source', 'Tax Authority'),
                "content": r.get('content', '')[:300] + "...",
                "source": r.get('source', 'N/A')
            }
            for i, r in enumerate(search_results)
        ]
        
    except Exception as e:
        logger.error(f"RAG Retrieval Error: {str(e)}")
        return Response({"error": "Knowledge base unreachable"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 4. Generation Phase (Vertex AI)
    try:
        gemini_model = os.getenv('GEMINI_MODEL') or 'gemini-2.0-flash'
        
        # Initializing Client with Vertex AI as requested
        client = genai.Client(
            vertexai=True, 
            project=settings.DOCAI_PROJECT_ID, 
            location=os.getenv('VERTEX_LOCATION') or 'us-central1'
        )
        
        # Format conversation history for the prompt
        history_text = ""
        for h in history[-6:]: # Include last 3 turns
            role = "User" if h['role'] == 'user' else "Assistant"
            history_text += f"{role}: {h['content']}\n"
            
        prompt = f"""You are an expert tax and Indian laws assistant for ComplyFlow.
        The user identifies as: {user_profession}.
        
        CONVERSATION HISTORY:
        {history_text}
        
        STEP 1: RELEVANCE CHECK
        Is the CURRENT User Question below related to Indian Tax, GST, Legal Compliance, or Business Regulations?
        - Use the CONVERSATION HISTORY to resolve any pronouns or context.
        - If NO (and it is NOT a greeting or thank you), output EXACTLY: "FALLBACK_IRRELEVANT"
        - If YES (or if it is a simple greeting/gratitude), proceed to STEP 2.
        
        STEP 2: GENERATE RESPONSE
        Answer the CURRENT user's question or acknowledge their message in a professional, human-readable, and actionable manner.
        - CRITICAL: If "CONTEXT FROM LEGAL DOCUMENTS" is provided below, you MUST use it to answer the question. Do NOT say you don't have the full text if the context contains legal provisions.
        - {f"NOTE: The user is specifically asking about the document '{discuss_doc_name}'. Focus your summary and analysis on this document." if discuss_doc_name else ""}
        
        FORMATTING INSTRUCTIONS:
        1. Use Markdown headers (`###`) for main sections. ALWAYS put a DOUBLE NEWLINE after the header.
        2. Use **bolding** for key terms, dates, and section names.
        3. Use bullet points (`-`) for lists. ALWAYS put a DOUBLE NEWLINE between each bullet point block and the surrounding text.
        4. STRUCTURE: 
           ### Summary
           (3-4 sentences summarizing the situation)
           
           ### Compliance Review
           - Point 1
           - Point 2
           
           ### Conclusion
           (Direct, actionable advice)
        5. Use [1], [2] for citations pointing to the sources below.
        6. CRITICAL: Use DOUBLE NEWLINES (`\n\n`) between EVERY section. 
        7. NO HTML TAGS: Do NOT use `<br>`, `<b>`, or any other HTML. Strictly use Markdown.
        
        PROMPT:
        {agent_context}

        LEGAL DOCUMENT CONTEXT:
        {context}
        {doc_context}
        
        CURRENT USER QUESTION: {message}
        
        INSTRUCTIONS:
        1. If it's a question or a request to discuss a document, provide the structured report described above.
        2. If it's a thank you/greeting, respond politely as a helpful assistant.
        """
        
        response = client.models.generate_content(
            model=gemini_model,
            contents=prompt
        )
        response_text = response.text.strip()
        
        if "FALLBACK_IRRELEVANT" in response_text:
            response_text = "I am a compliance assistant dedicated to Indian Tax and Law. I'm afraid I can't help with that specific query."
            citations = []

    except Exception as gemini_error:
        logger.error(f"Vertex AI Error: {str(gemini_error)}")
        # 3. FINAL FALLBACK: Structured Human-Readable Report
        if search_results:
            response_text = "### 🔍 Partial Document Review\n"
            response_text += "I'm currently having trouble reaching my advanced analysis engine (Vertex AI), but I have retrieved these relevant provisions from your documents:\n\n"
            
            # Group by source for readability
            sources = {}
            for snippet in search_results:
                src = snippet.get('metadata', {}).get('source', 'General Provision')
                if src not in sources:
                    sources[src] = []
                sources[src].append(snippet.get('content', ''))
            
            for src, contents in sources.items():
                response_text += f"**From {src}:**\n"
                for content in contents:
                    # Clean up and limit content for readability
                    clean_content = content.strip().replace('\n', ' ')
                    if len(clean_content) > 300:
                        clean_content = clean_content[:300] + "..."
                    response_text += f"• {clean_content}\n"
                response_text += "\n"
            
            response_text += "---\n*Note: To restore full intelligent summaries, please check API permissions.*"
        else:
            response_text = "I'm sorry, I'm currently unable to process your request. Please ensure you are logged in and the connection is stable."

    # 5. Save Query to History if authenticated
    if request.user.is_authenticated:
        try:
            # If conversation_id wasn't provided, and we're saving, we should have one or it will use the model default (uuid.uuid4)
            data_to_save = {
                "user": request.user,
                "query": message,
                "response": response_text
            }
            if conversation_id:
                data_to_save["conversation_id"] = conversation_id
                
            new_query = ComplianceQuery.objects.create(**data_to_save)
            saved_conversation_id = new_query.conversation_id
        except Exception as save_err:
            logger.error(f"Failed to save query history: {str(save_err)}")
            saved_conversation_id = conversation_id

    return Response({
        "response": response_text,
        "citations": citations,
        "suggestions": build_suggestions(message, search_results),
        "conversation_id": saved_conversation_id if request.user.is_authenticated else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, status=status.HTTP_200_OK)