# Sample Aviation Documents

This directory contains sample PDF files for testing the Pilot Portal upload functionality.

## 📋 Available Sample Files

### Medical Certificates

1. **sample-class1-medical.pdf**
   - Class 1 Medical Certificate
   - Valid for 12 months
   - Required for: Commercial pilots, airline transport pilots
   - Contains: Pilot info, examination details, physician signature

2. **sample-class2-medical.pdf**
   - Class 2 Medical Certificate
   - Valid for 24 months
   - Required for: Private pilots, recreational pilots
   - Contains: Pilot info, examination details, physician signature

### Pilot Licenses

3. **sample-spl-license.pdf**
   - Student Pilot License
   - Valid for 24 months
   - Includes: Solo flight authorization, day VFR operations
   - Limitations: No passengers, no compensation/hire

4. **sample-cpl-license.pdf**
   - Commercial Pilot License
   - Valid for 5 years
   - Includes: Single-engine land, instrument airplane ratings
   - Endorsements: High performance, complex aircraft

## 🚀 How to Use

1. **Testing Medical Upload**:
   - Navigate to the Medicals page in the Pilot Portal
   - Click "Upload Medical Certificate"
   - Select either `sample-class1-medical.pdf` or `sample-class2-medical.pdf`
   - Fill in the required details

2. **Testing License Upload**:
   - Navigate to the Licenses page in the Pilot Portal
   - Click "Add New License"
   - Select either `sample-spl-license.pdf` or `sample-cpl-license.pdf`
   - Fill in the required details

## 🔄 Regenerating Files

If you need to regenerate these sample files with updated dates:

```bash
cd sample-documents
python3 -m venv venv
source venv/bin/activate
pip install reportlab
python3 generate_sample_pdfs.py
deactivate
```

## ⚠️ Important Notes

- These are **SAMPLE DOCUMENTS** for testing purposes only
- They contain fictional information
- Do not use these documents for any official aviation purposes
- The certificates and licenses shown are not valid for actual flight operations

## 📝 Sample Data Used

All documents contain the following sample data:
- **Name**: John Michael Smith
- **Date of Birth**: January 15, 1990
- **Nationality**: United States
- **Address**: 123 Aviation Street, Pilot City, PC 12345

## 🛠️ Technical Details

- Format: PDF
- Page Size: Letter (8.5" x 11")
- Generated using: ReportLab Python library
- Features: Tables, styled text, headers, footers, signatures

## 📞 Support

If you need different sample documents or encounter any issues, please contact the development team.
