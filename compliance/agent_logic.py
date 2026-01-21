"""
ComplyFlow - Autonomous Compliance Agent Logic

This module contains AI-powered logic for autonomous document analysis and compliance auditing.
It uses Google Vertex AI (Gemini) to assess the impact of new regulatory documents and audit invoices.

Functions:
- generate_autonomous_action: Analyzes regulatory documents and generates impact levels and action drafts.
- audit_invoice_against_rule: Audits invoices against legal rules and flags violations.

Note: Requires Google Cloud credentials and Vertex AI API access.
"""

import os
import json
from google import genai
from django.conf import settings

def generate_autonomous_action(doc_text, doc_name):
    """
    Uses Vertex AI to analyze a document and generate:
    1. Impact Level (HIGH, MEDIUM, LOW)
    2. An Action Draft (Email to clients, checklist, etc.)
    """
    print(f"[Agent] Autonomously analyzing impact for: {doc_name}...")
    
    # Initialize Vertex Client
    client = genai.Client(
        vertexai=True, 
        project=settings.DOCAI_PROJECT_ID, 
        location=os.getenv('VERTEX_LOCATION') or 'us-central1'
    )
    
    # We only take the first 5000 characters to save tokens/speed
    prompt = f"""You are an autonomous compliance agent for ComplyFlow. 
    A new legal document has been discovered: '{doc_name}'.
    
    DOCUMENT CONTENT PREVIEW:
    {doc_text[:5000]}
    
    TASK:
    1. Assess the urgency and financial impact of this document.
    2. Assign an IMPACT LEVEL: 'HIGH' (major law change/penalties), 'MEDIUM' (process change/deadlines), or 'LOW' (clarifications).
    3. DRAFT AN ACTION: If it's a major change, draft a professional email to clients. If it's a process change, draft a 3-step compliance checklist.
    
    OUTPUT FORMAT (EXACTLY AS JSON):
    {{
        "impact_level": "HIGH/MEDIUM/LOW",
        "action_draft": "The drafted text here...",
        "ai_analysis": "One sentence summary of why you chose this impact level."
    }}
    """
    
    try:
        response = client.models.generate_content(
            model=os.getenv('GEMINI_MODEL') or 'gemini-2.0-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
            }
        )
        
        result = json.loads(response.text)
        print(f"[Agent] Analysis complete. Impact: {result.get('impact_level')}")
        return result
        
    except Exception as e:
        print(f"[Agent] Error during autonomous analysis: {e}")
        return {
            "impact_level": "LOW",
            "action_draft": "New document discovered. Click 'Discuss' to learn more.",
            "ai_analysis": "Default fallback due to processing error."
        }

def audit_invoice_against_rule(invoice_data, rule_text):
    """
    Compares extracted invoice data against a specific legal rule using Vertex AI.
    Returns: (is_flagged: bool, reason: str)
    """
    print(f"[Agent] Auditing invoice against rules...")
    
    client = genai.Client(
        vertexai=True, 
        project=settings.DOCAI_PROJECT_ID, 
        location=os.getenv('VERTEX_LOCATION') or 'us-central1'
    )
    
    # Format entities for the prompt
    entities_summary = ""
    for e in invoice_data.get('entities', []):
        entities_summary += f"- {e['type']}: {e['value']}\n"
    
    prompt = f"""You are a compliance auditor for ComplyFlow.
    
    LEGAL RULE CONTEXT:
    {rule_text}
    
    INVOICE DATA:
    Text Preview: {invoice_data.get('text', '')[:1000]}
    Extracted Entities:
    {entities_summary}
    
    TASK:
    Does the Invoice Data violate the Legal Rule Context? 
    Specifically check for tax rates, ITC eligibility, and specific item restrictions mentioned in the rule.
    
    OUTPUT FORMAT (EXACTLY AS JSON):
    {{
        "is_flagged": true/false,
        "reason": "Detailed explanation of the violation if flagged, or 'Compliant' if not."
    }}
    """
    
    try:
        response = client.models.generate_content(
            model=os.getenv('GEMINI_MODEL') or 'gemini-2.0-flash',
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        
        result = json.loads(response.text)
        return result.get('is_flagged', False), result.get('reason', '')
    except Exception as e:
        print(f"[Agent] Audit Error: {e}")
        return False, None
