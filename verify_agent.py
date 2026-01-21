import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'complyflow_backend.settings')
django.setup()

from compliance.agent_logic import generate_autonomous_action

def test_agentic_analysis():
    test_text = """
    GOVERNMENT OF INDIA - MINISTRY OF FINANCE
    NOTIFICATION: Immediate waiver of late fees for GSTR-3B filings for FY 2024-25.
    
    CRITICAL: This applies to all taxpayers in the MSME category. 
    Failure to comply with the new filing deadline of 20th July 2025 will result in a penalty of 10,000 INR per day.
    """
    
    test_doc_name = "GST_Late_Fee_Waiver_Alert.pdf"
    
    print("--- STARTING AGENTIC TEST ---")
    result = generate_autonomous_action(test_text, test_doc_name)
    print("\n--- RESULTS ---")
    print(f"Impact Level: {result.get('impact_level')}")
    print(f"Action Draft: {result.get('action_draft')}")
    print(f"AI Analysis: {result.get('ai_analysis')}")
    print("--- TEST COMPLETE ---")

if __name__ == "__main__":
    test_agentic_analysis()
