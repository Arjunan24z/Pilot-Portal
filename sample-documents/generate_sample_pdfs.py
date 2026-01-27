#!/usr/bin/env python3
"""
Generate Sample Aviation PDF Documents
This script creates realistic sample PDFs for:
- Class 1 Medical Certificate
- Class 2 Medical Certificate
- Student Pilot License (SPL)
- Commercial Pilot License (CPL)
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from datetime import datetime, timedelta
import os

def create_medical_certificate(filename, medical_class):
    """Create a sample medical certificate PDF"""
    doc = SimpleDocTemplate(filename, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a365d'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#2d3748'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    # Title
    title = Paragraph(f"MEDICAL CERTIFICATE - CLASS {medical_class}", title_style)
    story.append(title)
    story.append(Spacer(1, 0.2*inch))
    
    # Certificate Number
    cert_number = f"MED-{medical_class}-2026-{1234 + int(medical_class)}"
    cert_para = Paragraph(f"<b>Certificate Number:</b> {cert_number}", styles['Normal'])
    story.append(cert_para)
    story.append(Spacer(1, 0.3*inch))
    
    # Authority Info
    authority = Paragraph("<b>CIVIL AVIATION AUTHORITY</b>", header_style)
    story.append(authority)
    story.append(Spacer(1, 0.2*inch))
    
    # Pilot Information
    pilot_info_data = [
        ['Pilot Information', ''],
        ['Full Name:', 'John Michael Smith'],
        ['Date of Birth:', 'January 15, 1990'],
        ['License Number:', 'SPL-2023-5678'],
        ['Nationality:', 'United States'],
    ]
    
    pilot_table = Table(pilot_info_data, colWidths=[2.5*inch, 3.5*inch])
    pilot_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#edf2f7')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    story.append(pilot_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Medical Examination Details
    exam_date = datetime.now()
    expiry_date = exam_date + timedelta(days=365 if medical_class == "1" else 730)
    
    medical_data = [
        ['Medical Examination Details', ''],
        ['Examination Date:', exam_date.strftime('%B %d, %Y')],
        ['Valid Until:', expiry_date.strftime('%B %d, %Y')],
        ['Examining Physician:', 'Dr. Sarah Johnson, MD'],
        ['Medical Facility:', 'Aviation Medical Center'],
        ['Class of Medical:', f'Class {medical_class}'],
    ]
    
    medical_table = Table(medical_data, colWidths=[2.5*inch, 3.5*inch])
    medical_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#edf2f7')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    story.append(medical_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Medical Standards
    standards_text = f"""
    <b>Medical Standards Met:</b><br/>
    ✓ Vision requirements met<br/>
    ✓ Hearing requirements met<br/>
    ✓ Cardiovascular examination normal<br/>
    ✓ Neurological examination normal<br/>
    ✓ No disqualifying conditions found<br/>
    <br/>
    <b>Limitations:</b> None<br/>
    <br/>
    <b>Remarks:</b> Pilot meets all requirements for Class {medical_class} medical certificate.
    """
    story.append(Paragraph(standards_text, styles['Normal']))
    story.append(Spacer(1, 0.4*inch))
    
    # Signatures
    sig_data = [
        ['', ''],
        ['_' * 40, '_' * 40],
        ['Examining Physician Signature', 'Date'],
        ['Dr. Sarah Johnson, MD', exam_date.strftime('%B %d, %Y')],
    ]
    
    sig_table = Table(sig_data, colWidths=[3*inch, 3*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 2), (-1, -1), 5),
    ]))
    story.append(sig_table)
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#718096'),
        alignment=TA_CENTER
    )
    footer = Paragraph(
        f"This is a sample medical certificate for demonstration purposes only.<br/>"
        f"Certificate Number: {cert_number} | Issued: {exam_date.strftime('%Y-%m-%d')}",
        footer_style
    )
    story.append(footer)
    
    doc.build(story)
    print(f"✓ Created: {filename}")

def create_pilot_license(filename, license_type):
    """Create a sample pilot license PDF"""
    doc = SimpleDocTemplate(filename, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a365d'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#2d3748'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    license_full_name = "STUDENT PILOT LICENSE" if license_type == "SPL" else "COMMERCIAL PILOT LICENSE"
    
    # Title
    title = Paragraph(license_full_name, title_style)
    story.append(title)
    story.append(Spacer(1, 0.2*inch))
    
    # License Number
    license_number = f"{license_type}-2026-{5678 if license_type == 'SPL' else 9012}"
    license_para = Paragraph(f"<b>License Number:</b> {license_number}", styles['Normal'])
    story.append(license_para)
    story.append(Spacer(1, 0.3*inch))
    
    # Authority Info
    authority = Paragraph("<b>CIVIL AVIATION AUTHORITY</b>", header_style)
    story.append(authority)
    story.append(Spacer(1, 0.2*inch))
    
    # Pilot Information
    pilot_info_data = [
        ['License Holder Information', ''],
        ['Full Name:', 'John Michael Smith'],
        ['Date of Birth:', 'January 15, 1990'],
        ['Nationality:', 'United States'],
        ['Address:', '123 Aviation Street, Pilot City, PC 12345'],
    ]
    
    pilot_table = Table(pilot_info_data, colWidths=[2.5*inch, 3.5*inch])
    pilot_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#edf2f7')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    story.append(pilot_table)
    story.append(Spacer(1, 0.3*inch))
    
    # License Details
    issue_date = datetime.now()
    expiry_date = issue_date + timedelta(days=730 if license_type == "SPL" else 1825)
    
    license_data = [
        ['License Details', ''],
        ['License Type:', license_full_name],
        ['Date of Issue:', issue_date.strftime('%B %d, %Y')],
        ['Date of Expiry:', expiry_date.strftime('%B %d, %Y')],
        ['Issuing Authority:', 'Federal Aviation Administration'],
    ]
    
    license_table = Table(license_data, colWidths=[2.5*inch, 3.5*inch])
    license_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#edf2f7')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e0')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    story.append(license_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Ratings and Endorsements
    if license_type == "SPL":
        ratings_text = """
        <b>Endorsements:</b><br/>
        ✓ Solo flight authorized<br/>
        ✓ Day VFR operations<br/>
        ✓ Single-engine land aircraft<br/>
        <br/>
        <b>Limitations:</b><br/>
        • Must carry valid medical certificate<br/>
        • No passengers authorized<br/>
        • No operations for compensation or hire<br/>
        • Must comply with flight instructor endorsements
        """
    else:
        ratings_text = """
        <b>Ratings:</b><br/>
        ✓ Airplane Single-Engine Land<br/>
        ✓ Instrument Airplane<br/>
        ✓ Commercial Privileges<br/>
        <br/>
        <b>Endorsements:</b><br/>
        ✓ High Performance Aircraft<br/>
        ✓ Complex Aircraft<br/>
        <br/>
        <b>Limitations:</b> None
        """
    
    story.append(Paragraph(ratings_text, styles['Normal']))
    story.append(Spacer(1, 0.4*inch))
    
    # Signatures
    sig_data = [
        ['', ''],
        ['_' * 40, '_' * 40],
        ['Authorized Signature', 'Date'],
        ['Chief Flight Standards Inspector', issue_date.strftime('%B %d, %Y')],
    ]
    
    sig_table = Table(sig_data, colWidths=[3*inch, 3*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 2), (-1, -1), 5),
    ]))
    story.append(sig_table)
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#718096'),
        alignment=TA_CENTER
    )
    footer = Paragraph(
        f"This is a sample pilot license for demonstration purposes only.<br/>"
        f"License Number: {license_number} | Issued: {issue_date.strftime('%Y-%m-%d')}",
        footer_style
    )
    story.append(footer)
    
    doc.build(story)
    print(f"✓ Created: {filename}")

def main():
    print("\n🛩️  Generating Sample Aviation PDF Documents...\n")
    
    # Create sample-documents directory if it doesn't exist
    os.makedirs('sample-documents', exist_ok=True)
    
    # Generate Medical Certificates
    create_medical_certificate('sample-documents/sample-class1-medical.pdf', "1")
    create_medical_certificate('sample-documents/sample-class2-medical.pdf', "2")
    
    # Generate Pilot Licenses
    create_pilot_license('sample-documents/sample-spl-license.pdf', "SPL")
    create_pilot_license('sample-documents/sample-cpl-license.pdf', "CPL")
    
    print("\n✅ All sample PDF files have been generated successfully!")
    print("\n📁 Files created:")
    print("   • sample-class1-medical.pdf - Class 1 Medical Certificate")
    print("   • sample-class2-medical.pdf - Class 2 Medical Certificate")
    print("   • sample-spl-license.pdf - Student Pilot License")
    print("   • sample-cpl-license.pdf - Commercial Pilot License")
    print("\n💡 You can use these files to test the upload functionality in your Pilot Portal.\n")

if __name__ == "__main__":
    main()
