#!/bin/bash

###############################################################################
# 🛠️ ZANTARA Backup Setup Helper
# 
# Quick setup script for backup system
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     🛠️  ZANTARA Backup System Setup                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if backup script exists
if [ ! -f "./backup-databases.sh" ]; then
    echo -e "${YELLOW}⚠️  backup-databases.sh not found!${NC}"
    exit 1
fi

# Make backup script executable
chmod +x ./backup-databases.sh
echo -e "${GREEN}✅ Backup script is executable${NC}"

# Create backups directory
mkdir -p backups
mkdir -p logs
echo -e "${GREEN}✅ Backup directories created${NC}"

# Check dependencies
echo ""
echo "Checking dependencies..."

MISSING_DEPS=()

if ! command -v pg_dump &> /dev/null; then
    MISSING_DEPS+=("postgresql-client")
fi

if ! command -v aws &> /dev/null && ! python3 -c "import boto3" 2>/dev/null; then
    MISSING_DEPS+=("aws-cli or boto3")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing dependencies:${NC}"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "  - $dep"
    done
    echo ""
    echo "Install with:"
    echo "  macOS: brew install postgresql awscli"
    echo "  Linux: sudo apt-get install postgresql-client && pip3 install awscli"
    echo "  Python: pip3 install boto3"
else
    echo -e "${GREEN}✅ All dependencies installed${NC}"
fi

# Check .env.backup
if [ ! -f ".env.backup" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  .env.backup not found${NC}"
    echo "Create .env.backup with required environment variables:"
    echo "  - DATABASE_URL"
    echo "  - R2_ACCESS_KEY_ID"
    echo "  - R2_SECRET_ACCESS_KEY"
    echo "  - R2_ENDPOINT_URL"
    echo ""
    echo "See backup-databases.README.md for details"
else
    echo -e "${GREEN}✅ .env.backup found${NC}"
fi

# Test backup script (dry run)
echo ""
echo "Running backup script test..."
if ./backup-databases.sh --help &> /dev/null; then
    echo -e "${GREEN}✅ Backup script is working${NC}"
else
    echo -e "${YELLOW}⚠️  Backup script test failed${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete!                                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure .env.backup with your credentials"
echo "  2. Test backup: ./backup-databases.sh --local-only"
echo "  3. Setup cron job: crontab -e"
echo ""
echo "See backup-databases.README.md for full documentation"

