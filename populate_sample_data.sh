#!/bin/bash

# Populate Pilot Portal with Sample Data
# This script adds realistic test data to make the application look functional

echo "🚀 Starting to populate Pilot Portal with sample data..."

API_URL="http://localhost:5000/api"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Register/Login user
echo -e "${BLUE}📝 Creating test user account...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Captain John Smith",
    "email": "pilot@flyaviation.com",
    "password": "pilot123"
  }')

# Try to login (in case user already exists)
echo -e "${BLUE}🔐 Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pilot@flyaviation.com",
    "password": "pilot123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get authentication token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"

# Step 2: Add Logbook Entries
echo -e "\n${BLUE}✈️  Adding flight logbook entries...${NC}"

# Entry 1: Recent training flight
curl -s -X POST "${API_URL}/logbook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "date": "2026-01-20",
    "aircraft": "C172",
    "departureAirport": "KJFK",
    "arrivalAirport": "KEWR",
    "totalTime": 1.5,
    "pilotInCommand": 0,
    "dualReceived": 1.5,
    "nightTime": 0,
    "crossCountry": 0,
    "instrumentActual": 0,
    "instrumentSimulated": 0.5,
    "dayLandings": 3,
    "nightLandings": 0,
    "flightType": "Training",
    "instructorName": "Sarah Johnson, CFI",
    "remarks": "Pattern work, touch and goes, instrument approach practice"
  }' > /dev/null

echo -e "${GREEN}  ✓ Added training flight (Jan 20)${NC}"

# Entry 2: Solo cross-country
curl -s -X POST "${API_URL}/logbook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "date": "2026-01-15",
    "aircraft": "C172",
    "departureAirport": "KJFK",
    "arrivalAirport": "KBOS",
    "totalTime": 2.8,
    "pilotInCommand": 2.8,
    "soloTime": 2.8,
    "crossCountry": 2.8,
    "nightTime": 0,
    "instrumentActual": 0,
    "instrumentSimulated": 0,
    "dayLandings": 2,
    "nightLandings": 0,
    "flightType": "Personal",
    "remarks": "Solo XC to Boston and back, excellent weather"
  }' > /dev/null

echo -e "${GREEN}  ✓ Added solo cross-country (Jan 15)${NC}"

# Entry 3: Night flight
curl -s -X POST "${API_URL}/logbook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "date": "2026-01-10",
    "aircraft": "PA-28",
    "departureAirport": "KJFK",
    "arrivalAirport": "KHPN",
    "totalTime": 1.2,
    "pilotInCommand": 1.2,
    "nightTime": 1.2,
    "crossCountry": 0,
    "instrumentActual": 0,
    "instrumentSimulated": 0,
    "dayLandings": 0,
    "nightLandings": 4,
    "flightType": "Training",
    "instructorName": "Mike Davis, CFI",
    "remarks": "Night currency, pattern work at Westchester"
  }' > /dev/null

echo -e "${GREEN}  ✓ Added night flight (Jan 10)${NC}"

# Entry 4: Instrument training
curl -s -X POST "${API_URL}/logbook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "date": "2026-01-05",
    "aircraft": "C172",
    "departureAirport": "KTEB",
    "arrivalAirport": "KTEB",
    "totalTime": 2.0,
    "pilotInCommand": 0,
    "dualReceived": 2.0,
    "instrumentActual": 1.0,
    "instrumentSimulated": 1.0,
    "dayLandings": 2,
    "nightLandings": 0,
    "flightType": "Training",
    "instructorName": "Sarah Johnson, CFII",
    "remarks": "ILS and VOR approaches, hold procedures"
  }' > /dev/null

echo -e "${GREEN}  ✓ Added instrument training (Jan 5)${NC}"

# Entry 5: Personal flight
curl -s -X POST "${API_URL}/logbook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "date": "2025-12-28",
    "aircraft": "C172",
    "departureAirport": "KJFK",
    "arrivalAirport": "KPHL",
    "totalTime": 1.8,
    "pilotInCommand": 1.8,
    "crossCountry": 1.8,
    "dayLandings": 2,
    "nightLandings": 0,
    "flightType": "Personal",
    "remarks": "Flight to Philadelphia for weekend trip"
  }' > /dev/null

echo -e "${GREEN}  ✓ Added personal flight (Dec 28)${NC}"

# Entry 6: Recent PIC time
curl -s -X POST "${API_URL}/logbook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "date": "2026-01-22",
    "aircraft": "PA-28",
    "departureAirport": "KEWR",
    "arrivalAirport": "KEWR",
    "totalTime": 1.0,
    "pilotInCommand": 1.0,
    "dayLandings": 4,
    "nightLandings": 0,
    "flightType": "Personal",
    "remarks": "Pattern work to maintain currency"
  }' > /dev/null

echo -e "${GREEN}  ✓ Added recent PIC flight (Jan 22)${NC}"

# Step 3: Upload Medical Certificates
echo -e "\n${BLUE}🏥 Uploading medical certificates...${NC}"

# Class 1 Medical
curl -s -X POST "${API_URL}/medicals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "classType=Class 1" \
  -F "issueDate=2025-01-01" \
  -F "expiryDate=2026-12-31" \
  -F "remarks=Annual medical examination - all checks passed" \
  -F "document=@sample-documents/sample-class1-medical.pdf" > /dev/null

echo -e "${GREEN}  ✓ Uploaded Class 1 Medical (expires Dec 31, 2026)${NC}"

# Class 2 Medical  
curl -s -X POST "${API_URL}/medicals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "classType=Class 2" \
  -F "issueDate=2025-07-01" \
  -F "expiryDate=2027-06-30" \
  -F "remarks=Biennial medical examination - no restrictions" \
  -F "document=@sample-documents/sample-class2-medical.pdf" > /dev/null

echo -e "${GREEN}  ✓ Uploaded Class 2 Medical (expires Jun 30, 2027)${NC}"

# Step 4: Upload Pilot Licenses
echo -e "\n${BLUE}📜 Uploading pilot licenses...${NC}"

# Student Pilot License (SPL)
curl -s -X POST "${API_URL}/license" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "type=SPL" \
  -F "licenseNumber=SPL-987654" \
  -F "issueDate=2024-03-15" \
  -F "expiryDate=2029-03-15" \
  -F "remarks=Student Pilot License - valid for training flights" \
  -F "document=@sample-documents/sample-spl-license.pdf" > /dev/null

echo -e "${GREEN}  ✓ Uploaded Student Pilot License (expires Mar 15, 2029)${NC}"

# Commercial Pilot License (CPL)
curl -s -X POST "${API_URL}/license" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "type=CPL" \
  -F "licenseNumber=CPL-456789" \
  -F "issueDate=2025-01-10" \
  -F "expiryDate=2030-01-10" \
  -F "remarks=Commercial Pilot License - multi-engine land" \
  -F "document=@sample-documents/sample-cpl-license.pdf" > /dev/null

echo -e "${GREEN}  ✓ Uploaded Commercial Pilot License (expires Jan 10, 2030)${NC}"

echo -e "\n${GREEN}✅ All sample data uploaded successfully!${NC}"
echo -e "\n📊 Summary:"
echo -e "  • 6 flight logbook entries (10.3 total hours)"
echo -e "  • 2 medical certificates (Class 1 & Class 2)"
echo -e "  • 2 pilot licenses (PPL & CPL)"
echo -e "\n🌐 Visit http://localhost:4200 to see your populated pilot portal!"
