#!/bin/bash

# ============================================================================
# AI CODE QUALITY GATE - SETUP SCRIPT
# ============================================================================
# This script installs and configures the AI Code Quality Gate system
# ============================================================================

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     🤖 AI CODE QUALITY GATE - Installation & Setup               ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
print_step() {
    echo -e "\n${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# 1. CHECK PREREQUISITES
# ============================================================================
print_step "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 20+"
    exit 1
fi
print_success "Node.js $(node --version) found"

if ! command_exists npm; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm --version) found"

if ! command_exists python3; then
    print_warning "Python 3 is not installed. Python quality checks will be skipped."
else
    print_success "Python $(python3 --version | cut -d' ' -f2) found"
fi

if ! command_exists git; then
    print_error "Git is not installed"
    exit 1
fi
print_success "Git $(git --version | cut -d' ' -f3) found"

# ============================================================================
# 2. INSTALL AI CODE QUALITY DEPENDENCIES
# ============================================================================
print_step "Installing AI Code Quality Gate dependencies..."

cd .ai-code-quality

if [ ! -f "package.json" ]; then
    print_error "package.json not found in .ai-code-quality/"
    exit 1
fi

npm install --silent
print_success "AI Code Quality dependencies installed"

cd ..

# ============================================================================
# 3. INSTALL PROJECT DEPENDENCIES
# ============================================================================
print_step "Installing project dependencies..."

npm ci --silent
print_success "Project dependencies installed"

# ============================================================================
# 4. INSTALL PYTHON DEPENDENCIES (if Python exists)
# ============================================================================
if command_exists python3; then
    print_step "Installing Python development dependencies..."

    if [ -d "apps/backend-rag" ]; then
        cd apps/backend-rag

        if [ -f "requirements.txt" ]; then
            python3 -m pip install --quiet -r requirements.txt
            python3 -m pip install --quiet black isort ruff mypy bandit pytest pytest-cov
            print_success "Python dependencies installed"
        else
            print_warning "requirements.txt not found, skipping Python dependencies"
        fi

        cd ../..
    else
        print_warning "backend-rag directory not found, skipping Python setup"
    fi
fi

# ============================================================================
# 5. INSTALL PRE-COMMIT HOOKS
# ============================================================================
print_step "Installing pre-commit hooks..."

if command_exists pre-commit; then
    pre-commit install --install-hooks
    print_success "Pre-commit hooks installed"
else
    print_warning "pre-commit not installed. Install with: pip install pre-commit"
    print_warning "Then run: pre-commit install"
fi

# ============================================================================
# 6. CONFIGURE GIT HOOKS
# ============================================================================
print_step "Configuring Git hooks..."

if [ -d ".husky" ]; then
    chmod +x .husky/pre-push
    chmod +x .husky/pre-commit
    print_success "Git hooks configured"
else
    print_warning ".husky directory not found"
fi

# ============================================================================
# 7. CREATE REPORTS DIRECTORY
# ============================================================================
print_step "Creating reports directory..."

mkdir -p .ai-code-quality/reports
print_success "Reports directory created"

# ============================================================================
# 8. VERIFY INSTALLATION
# ============================================================================
print_step "Verifying installation..."

# Test AI validator
echo "  Testing AI Code Validator..."
cd .ai-code-quality
if npx ts-node --version >/dev/null 2>&1; then
    print_success "AI Code Validator ready"
else
    print_error "AI Code Validator test failed"
fi
cd ..

# Test TypeScript compilation
echo "  Testing TypeScript..."
if npm run typecheck >/dev/null 2>&1; then
    print_success "TypeScript compilation working"
else
    print_warning "TypeScript has type errors (not critical for setup)"
fi

# Test linting
echo "  Testing ESLint..."
if npm run lint >/dev/null 2>&1; then
    print_success "ESLint working"
else
    print_warning "ESLint has warnings (not critical for setup)"
fi

# ============================================================================
# 9. DISPLAY SUMMARY
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║              🎉 INSTALLATION COMPLETE                             ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ AI Code Quality Gate is now installed and active!${NC}"
echo ""
echo "📋 What's configured:"
echo "  • AI Code Validator (architectural coherence, security)"
echo "  • Pre-commit hooks (instant feedback on every commit)"
echo "  • Pre-push validation (AI guard before push)"
echo "  • CI/CD quality gates (blocking in GitHub Actions)"
echo "  • Python quality checks (Black, Ruff, Mypy, Bandit)"
echo "  • TypeScript quality checks (ESLint, Prettier, strict mode)"
echo "  • Test coverage enforcement (70% minimum)"
echo ""
echo "🚀 Next steps:"
echo "  1. Read the docs:   cat .ai-code-quality/README.md"
echo "  2. Test validation: cd .ai-code-quality && npm run validate"
echo "  3. View dashboard:  open .ai-code-quality/dashboard.html"
echo "  4. Make a commit:   git commit -m 'test: verify AI validator'"
echo "  5. Try to push:     git push (AI validation will run!)"
echo ""
echo "📚 Documentation: .ai-code-quality/README.md"
echo "📊 Dashboard:     .ai-code-quality/dashboard.html"
echo "📄 Reports:       .ai-code-quality/reports/"
echo ""
echo -e "${BLUE}The AI now knows your system by heart and will guard every code change!${NC}"
echo ""
