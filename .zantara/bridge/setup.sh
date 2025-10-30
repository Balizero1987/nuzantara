#!/bin/bash
################################################################################
# ZANTARA BRIDGE SETUP SCRIPT v1.0
################################################################################
# Purpose: Install dependencies and setup ZANTARA Bridge system
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=============================================================================="
echo "  ZANTARA BRIDGE v1.0 - Setup"
echo "=============================================================================="
echo -e "${NC}"

# Check Python version
echo -e "${BLUE}➤ Checking Python version...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "${GREEN}✓ Python 3 found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check if in project directory
if [ ! -d "apps" ] || [ ! -d "website" ]; then
    echo -e "${YELLOW}⚠ Warning: Not in NUZANTARA-RAILWAY directory${NC}"
    echo "Current directory: $(pwd)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if virtual environment exists
echo ""
echo -e "${BLUE}➤ Checking Python virtual environment...${NC}"
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠ Virtual environment not found${NC}"
    read -p "Create new virtual environment? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 -m venv .venv
        echo -e "${GREEN}✓ Virtual environment created${NC}"
    else
        echo "Using system Python"
    fi
fi

# Activate virtual environment
if [ -d ".venv" ]; then
    echo -e "${BLUE}➤ Activating virtual environment...${NC}"
    source .venv/bin/activate
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
fi

# Install Python dependencies
echo ""
echo -e "${BLUE}➤ Installing Python dependencies...${NC}"
pip install --quiet --upgrade pip

echo "Installing FastAPI..."
pip install --quiet fastapi uvicorn[standard]

echo "Installing watchdog..."
pip install --quiet watchdog

echo "Installing PyYAML..."
pip install --quiet pyyaml

echo "Installing requests..."
pip install --quiet requests

echo -e "${GREEN}✓ All dependencies installed${NC}"

# Make scripts executable
echo ""
echo -e "${BLUE}➤ Setting up scripts...${NC}"
chmod +x .zantara/bridge/bridge_client.sh
chmod +x .zantara/bridge/bridge_server.py
chmod +x .zantara/bridge/bridge_watcher.py
echo -e "${GREEN}✓ Scripts are now executable${NC}"

# Create requirements.txt
echo ""
echo -e "${BLUE}➤ Creating requirements.txt...${NC}"
cat > .zantara/bridge/requirements.txt <<EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
watchdog==3.0.0
pyyaml==6.0.1
requests==2.31.0
EOF
echo -e "${GREEN}✓ requirements.txt created${NC}"

# Check directory structure
echo ""
echo -e "${BLUE}➤ Verifying directory structure...${NC}"
for dir in inbox logs executed config; do
    if [ -d ".zantara/bridge/$dir" ]; then
        echo -e "${GREEN}✓ $dir directory exists${NC}"
    else
        echo -e "${YELLOW}⚠ Creating $dir directory${NC}"
        mkdir -p ".zantara/bridge/$dir"
    fi
done

# Create README
echo ""
echo -e "${BLUE}➤ Creating README...${NC}"
cat > .zantara/bridge/README.md <<'EOF'
# ZANTARA Bridge v1.0

ChatGPT Atlas ⇄ Local AI Executor Bridge System

## Quick Start

1. **Start the bridge server:**
   ```bash
   python bridge_server.py
   ```

2. **Start the watcher (in another terminal):**
   ```bash
   python bridge_watcher.py
   ```

3. **Submit a task:**
   ```bash
   ./bridge_client.sh "Your task here" "context" "priority"
   ```

## Components

- `bridge_server.py` - FastAPI server that receives tasks
- `bridge_watcher.py` - Auto-processor that watches inbox and executes tasks
- `bridge_client.sh` - CLI tool to submit tasks
- `config/bridge_config.yaml` - Configuration file

## Directory Structure

```
.zantara/bridge/
├── inbox/          - New tasks land here
├── executed/       - Completed tasks moved here
├── logs/           - Server and watcher logs
├── config/         - Configuration files
├── bridge_server.py
├── bridge_watcher.py
└── bridge_client.sh
```

## Configuration

Edit `config/bridge_config.yaml` to customize:
- Processor type (claude, manual)
- Auto-processing behavior
- Logging settings
- Context-specific configurations

## Endpoints

- `POST /commit` - Submit a new task
- `GET /status` - Check inbox/executed status
- `POST /mark_done` - Mark task as completed
- `GET /health` - Health check
- `GET /logs` - Retrieve logs

## Examples

Submit a high-priority task:
```bash
./bridge_client.sh "Implement auth module" "nuzantara" "high"
```

Check status:
```bash
curl http://127.0.0.1:5050/status | jq
```

View logs:
```bash
curl http://127.0.0.1:5050/logs | jq
```
EOF
echo -e "${GREEN}✓ README.md created${NC}"

# Summary
echo ""
echo -e "${GREEN}"
echo "=============================================================================="
echo "  Setup Complete!"
echo "=============================================================================="
echo -e "${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the bridge server:"
echo "   cd .zantara/bridge && python bridge_server.py"
echo ""
echo "2. In another terminal, start the watcher:"
echo "   cd .zantara/bridge && python bridge_watcher.py"
echo ""
echo "3. Submit a test task:"
echo "   cd .zantara/bridge && ./bridge_client.sh 'Test task' 'general' 'low'"
echo ""
echo "Or use the convenience script:"
echo "   ./run.sh"
echo ""
echo -e "${BLUE}Documentation: .zantara/bridge/README.md${NC}"
echo ""
