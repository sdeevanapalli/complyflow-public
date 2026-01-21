from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_searchable_pdf(path, content):
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter
    
    # Simple line-by-line drawing
    y = height - 50
    for line in content.split('\n'):
        c.drawString(50, y, line.strip())
        y -= 20
        if y < 50:
            c.showPage()
            y = height - 50
            
    c.save()
    print(f"Searchable PDF created at: {path}")

if __name__ == "__main__":
    circular_content = """
    GOVERNMENT OF INDIA - MINISTRY OF FINANCE
    CIRCULAR No. 99/2025
    
    Subject: Clarification on GST for Strategy Consultancy provided to foreign subsidiaries.
    
    It is hereby clarified that Strategy Consultancy provided to subsidiaries of Indian companies, 
    even if paid in foreign currency, does NOT qualify as Export of Services and is subject 
    to 18% GST with immediate effect.
    
    CRITICAL: Any taxpayer who has claimed 0% tax on such services in the last 6 months 
    must file an amendment and pay the tax with interest by the end of this month 
    to avoid a 200% penalty.
    """
    create_searchable_pdf("CBIC_Circular_99_2025_Consultancy.pdf", circular_content)
    
    invoice_content = """
    COM-TECH SOLUTIONS PVT LTD
    INVOICE No: CONS-2025-001
    Date: 15th June 2025
    
    Client: Global Strategy Inc (USA Subsidiary)
    Service: Strategy Consultancy & Market Analysis
    
    Subtotal: 5,00,000 INR
    IGST (0% - Export of Services): 0 INR
    Total Payable: 5,00,000 INR
    
    Note: Services provided to foreign subsidiary, qualified as export under old rules.
    """
    create_searchable_pdf("Invoice_CONS_2025_001.pdf", invoice_content)

    # TEST CASE 2: ITC RESTRICTION ON GIFTS
    itc_circular_content = """
    GOVERNMENT OF INDIA - MINISTRY OF FINANCE
    CIRCULAR No. 102/2025
    
    Subject: Restriction on Input Tax Credit (ITC) for Corporate Gifting.
    
    It is hereby notified that ITC shall NOT be available for any gift items distributed 
    to clients or employees where the value of a single gift exceeds 50,000 INR. 
    
    Impact: Claiming ITC on such luxury gifts will be treated as 'Tax Evasion' 
    and attracts a 100% penalty plus interest.
    """
    create_searchable_pdf("Circular_ITC_Restrictions_2025.pdf", itc_circular_content)

    watch_invoice_content = """
    ELITE TIMEKEEPERS LTD
    INVOICE No: WATCH-999
    Date: 20th June 2025
    
    Customer: COM-TECH SOLUTIONS PVT LTD
    Item: Rolex Submariner (Corporate Gift for Key Client)
    
    Subtotal: 2,00,000 INR
    GST (18%): 36,000 INR
    Total: 2,36,000 INR
    
    ITC Status: CLAIMED IN FULL (100%)
    """
    create_searchable_pdf("Invoice_Rolex_Corporate_Gift.pdf", watch_invoice_content)
