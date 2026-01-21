from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_compliance_doc(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    
    # Header
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, 720, "INTERNAL COMPLIANCE MEMO")
    
    c.setFont("Helvetica", 10)
    c.drawString(72, 705, "Date: 2023-11-15")
    c.drawString(72, 690, "Subject: Query regarding Input Tax Credit (ITC) eligibility")
    
    c.line(72, 680, 540, 680)
    
    # Body Text (This is what the Agent will read and search for)
    c.setFont("Helvetica", 12)
    text_lines = [
        "We need to verify the compliance status regarding the procurement of",
        "motor vehicles for transportation of employees.",
        "",
        "According to standard GST regulations, is Input Tax Credit (ITC)",
        "available for motor vehicles with seating capacity of less than",
        "13 persons used for business purposes?",
        "",
        "Please check the relevant CGST Act sections regarding blocked credits."
    ]
    
    y = 650
    for line in text_lines:
        c.drawString(72, y, line)
        y -= 20

    c.save()
    print(f"✅ Created compliance test doc: {filename}")

if __name__ == "__main__":
    create_compliance_doc("test_compliance_query.pdf")