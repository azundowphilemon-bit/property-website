import os
from datetime import datetime

try:
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.pagesizes import letter
    from reportlab.graphics.barcode import qr
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

def generate_transaction_pdf(transaction):
    if not HAS_REPORTLAB:
        raise Exception("reportlab is not installed. Run `pip install reportlab qrcode pillow`")

    reports_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    file_path = os.path.join(reports_dir, f"transaction_FAL_{transaction.id}.pdf")
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=18,
        spaceAfter=20
    )
    heading2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        spaceBefore=15,
        spaceAfter=10,
        textColor="#1a365d" # Dark blue branding
    )

    content = []

    # 1. Logo
    logo_path = os.path.join(os.path.dirname(__file__), "static", "logo.png")
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=120, height=50)
        content.append(logo)
    
    # 2. Header
    content.append(Paragraph("FALIBARI PROPERTY TRANSACTION REPORT", title_style))
    
    # 3. Transaction Summary
    content.append(Paragraph("Transaction Summary", heading2_style))
    content.append(Paragraph(f"<b>Reference ID:</b> FAL-{transaction.id}", styles["Normal"]))
    content.append(Paragraph(f"<b>Date Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))
    
    content.append(Spacer(1, 10))
    
    # 4. Buyer & Seller Details
    content.append(Paragraph("Buyer Details", styles["Heading3"]))
    content.append(Paragraph(f"<b>Name:</b> {transaction.user.full_name}", styles["Normal"]))
    content.append(Paragraph(f"<b>Email:</b> {transaction.user.email}", styles["Normal"]))
    
    content.append(Spacer(1, 10))
    
    content.append(Paragraph("Seller Details", styles["Heading3"]))
    content.append(Paragraph(f"<b>Name:</b> {transaction.property.owner.full_name}", styles["Normal"]))
    content.append(Paragraph(f"<b>Email:</b> {transaction.property.owner.email}", styles["Normal"]))

    content.append(Spacer(1, 10))

    # 5. Property Details
    content.append(Paragraph("Property Information", heading2_style))
    content.append(Paragraph(f"<b>Title:</b> {transaction.property.title}", styles["Normal"]))
    content.append(Paragraph(f"<b>Price:</b> GHS {transaction.property.price:,.2f}", styles["Normal"]))
    content.append(Paragraph(f"<b>Location:</b> {transaction.property.location}", styles["Normal"]))

    # 6. Timeline Section
    content.append(Paragraph("Transaction Timeline", heading2_style))
    # Render static timeline for completed since it reached completed
    timeline = [
        "Request Sent (Pending)",
        "Property and Seller Verified",
        "Buyer Approved",
        "Property Viewing Conducted",
        "Ownership Documents Secured by Falibari",
        "Payment Funds Submitted by Buyer",
        "Payment Confirmed by Platform",
        "Transaction Completed & Documents Released"
    ]
    for step in timeline:
        content.append(Paragraph(f"✓ {step}", styles["Normal"]))

    # 7. Payment Confirmation
    content.append(Paragraph("Payment Status", heading2_style))
    content.append(Paragraph("Payment verified and confirmed by platform.", styles["Normal"]))

    # 8. Admin Verification
    content.append(Paragraph("Admin Verification", heading2_style))
    content.append(Paragraph(
        "This transaction has been reviewed and mediated by the Falibari platform to ensure authenticity and security for both parties.",
        styles["Normal"]
    ))

    # 9. Signature Section
    content.append(Spacer(1, 30))
    content.append(Paragraph("Authorized Signature:", styles["Normal"]))
    content.append(Spacer(1, 20))
    content.append(Paragraph("__________________________", styles["Normal"]))
    content.append(Paragraph("Falibari Admin", styles["Normal"]))

    # 10. QR Code
    content.append(Spacer(1, 20))
    qr_code = qr.QrCodeWidget(f"https://falibari.com/verify/FAL-{transaction.id}")
    # QrCodeWidget isn't a Flowable directly, we need to wrap it if we want it in Platypus
    # But usually Drawing is used. Let's do it safely:
    from reportlab.graphics.shapes import Drawing
    d = Drawing(100, 100)
    d.add(qr_code)
    content.append(d)

    doc.build(content)
    return file_path
