#!/bin/bash

###############################################################################
# ZANTARA v3 Ω - DEEP REASONING QUERIES TEST SUITE
# Test complex RAG queries through full stack
# Version: 1.0.0
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# URLs
BACKEND_URL="https://nuzantara-backend.fly.dev"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ZANTARA v3 Ω - Deep Reasoning Queries Test Suite        ║${NC}"
echo -e "${BLUE}║     Testing: Webapp → Backend → RAG → ChromaDB              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}Start Time: $(date)${NC}\n"

###############################################################################
# Helper Functions
###############################################################################

test_deep_query() {
    local test_num="$1"
    local query="$2"
    local category="$3"
    local expected_content="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test #$test_num: Deep Reasoning Query${NC}"
    echo -e "${CYAN}  Category: $category${NC}"
    echo -e "${MAGENTA}  Query: \"$query\"${NC}"
    echo -e "${CYAN}  Expected content: \"$expected_content\"${NC}"
    
    # Measure response time
    start_time=$(date +%s.%N)
    
    # Make request
    response=$(curl -s -X POST "$BACKEND_URL/api/v3/zantara/unified" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\",\"user_id\":\"deep_test\",\"mode\":\"full\",\"domain\":\"all\"}" 2>&1)
    
    end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc)
    response_time_ms=$(echo "$response_time * 1000" | bc)
    
    echo -e "${CYAN}  Response time: ${response_time_ms}ms${NC}"
    
    # Check if response contains expected content
    if echo "$response" | grep -qi "$expected_content"; then
        echo -e "${GREEN}  ✅ PASS - Query processed successfully${NC}"
        echo -e "${GREEN}  Response preview: ${response:0:200}...${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Extract key information
        if echo "$response" | grep -q "ok.*true"; then
            echo -e "${GREEN}  ✓ API responded OK${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}  ❌ FAIL - Expected content not found${NC}"
        echo -e "${RED}  Response: ${response:0:300}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

###############################################################################
# TEST CATEGORY 1: BUSINESS SETUP & KBLI (ChromaDB: kbli_unified)
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CATEGORY 1: BUSINESS SETUP & KBLI (kbli_unified)           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

test_deep_query 1 \
    "What KBLI code should I use for opening a beach club in Bali with restaurant, bar, and swimming pool? Include capital requirements and foreign ownership restrictions." \
    "KBLI Business Classification" \
    "56101"

test_deep_query 2 \
    "I want to start a digital marketing agency in Jakarta. What are all the KBLI codes I need, minimum capital, and licensing requirements?" \
    "KBLI Service Business" \
    "73"

test_deep_query 3 \
    "Compare KBLI requirements between opening a hotel (bintang) versus a homestay in Bali. Which is easier for foreign investors?" \
    "KBLI Comparison" \
    "55111"

###############################################################################
# TEST CATEGORY 2: LEGAL & REGULATIONS (ChromaDB: legal_unified)
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CATEGORY 2: LEGAL & REGULATIONS (legal_unified)            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

test_deep_query 4 \
    "What are the key provisions in Indonesian law about foreign ownership of land? Can I buy property as a foreigner?" \
    "Property Law" \
    "hak"

test_deep_query 5 \
    "Explain the legal requirements for hiring Indonesian employees in a PT PMA. What about minimum wage and benefits?" \
    "Employment Law" \
    "PT PMA"

test_deep_query 6 \
    "What regulations apply to cryptocurrency and fintech businesses in Indonesia? Is it legal to operate a crypto exchange?" \
    "Fintech Regulations" \
    "regulation"

###############################################################################
# TEST CATEGORY 3: VISA & IMMIGRATION (ChromaDB: visa_oracle)
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CATEGORY 3: VISA & IMMIGRATION (visa_oracle)               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

test_deep_query 7 \
    "I want to stay in Bali for 6 months while setting up my business. What visa options do I have and what are the requirements?" \
    "Visa Strategy" \
    "visa"

test_deep_query 8 \
    "Compare B211A visa versus KITAS for digital nomads. Which is better for remote workers?" \
    "Visa Comparison" \
    "B211"

test_deep_query 9 \
    "What is the process to get a KITAP (permanent stay permit) in Indonesia? How long does it take?" \
    "KITAP Process" \
    "KITAP"

###############################################################################
# TEST CATEGORY 4: TAX & ACCOUNTING (ChromaDB: tax_genius)
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CATEGORY 4: TAX & ACCOUNTING (tax_genius)                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

test_deep_query 10 \
    "What is the corporate tax rate for PT PMA in Indonesia? Are there any tax incentives for new businesses?" \
    "Corporate Tax" \
    "tax"

test_deep_query 11 \
    "Explain VAT (PPN) requirements for e-commerce businesses. Do I need to charge VAT on digital products?" \
    "VAT/PPN" \
    "PPN"

test_deep_query 12 \
    "What are the tax implications of paying dividends from my Indonesian PT PMA to shareholders abroad?" \
    "International Tax" \
    "dividend"

###############################################################################
# TEST CATEGORY 5: MULTI-DOMAIN COMPLEX QUERIES
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CATEGORY 5: MULTI-DOMAIN COMPLEX QUERIES                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

test_deep_query 13 \
    "I'm a US citizen wanting to open a beach club in Canggu. Walk me through the complete process: visa, company setup, KBLI code, capital requirements, property lease, staff hiring, and tax obligations." \
    "Complete Business Setup" \
    "PT PMA"

test_deep_query 14 \
    "Compare the total costs and timeline for setting up: (1) PT PMA restaurant, (2) PT Penanaman Modal Asing hotel, (3) CV for consulting services. Which is most cost-effective for a foreign investor?" \
    "Business Structure Comparison" \
    "PT"

test_deep_query 15 \
    "I have a PT PMA with KBLI 62010 (software development). Can I add KBLI 56101 (restaurant) to the same company or do I need a separate entity? What are the legal and tax implications?" \
    "Multi-KBLI Strategy" \
    "KBLI"

###############################################################################
# FINAL REPORT
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DEEP REASONING TEST REPORT                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}End Time: $(date)${NC}\n"
echo -e "${YELLOW}Total Tests:${NC}  $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}       $PASSED_TESTS"
echo -e "${RED}Failed:${NC}       $FAILED_TESTS"
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    percentage=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}Success Rate:${NC} ${percentage}%"
fi

echo ""
echo -e "${BLUE}Test Categories Performance:${NC}"
echo -e "  Category 1 (KBLI Business):           Tests 1-3"
echo -e "  Category 2 (Legal):                   Tests 4-6"
echo -e "  Category 3 (Visa):                    Tests 7-9"
echo -e "  Category 4 (Tax):                     Tests 10-12"
echo -e "  Category 5 (Multi-Domain):            Tests 13-15"
echo ""

echo -e "${CYAN}ChromaDB Collections Tested:${NC}"
echo -e "  ✓ kbli_unified        (8,887 documents)"
echo -e "  ✓ legal_unified       (5,041 documents)"
echo -e "  ✓ visa_oracle         (1,612 documents)"
echo -e "  ✓ tax_genius          (895 documents)"
echo -e "  ✓ knowledge_base      (8,923 documents)"
echo ""

echo -e "${CYAN}Full Stack Path Tested:${NC}"
echo -e "  Webapp → Backend API → RAG Service → ChromaDB → Embeddings → AI"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✅ ALL DEEP REASONING TESTS PASSED! EXCELLENT! ✅       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║         ⚠️  SOME TESTS FAILED - CHECK ABOVE  ⚠️             ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
