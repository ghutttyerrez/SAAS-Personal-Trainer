#!/bin/bash

# ==========================================
# Master Setup Script for CI/CD Configuration
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_header() {
    echo -e "${PURPLE}======================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}======================================${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

check_prerequisites() {
    log_header "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check GitHub CLI
    if ! command -v gh &> /dev/null; then
        missing_tools+=("GitHub CLI (gh)")
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    # Check bc
    if ! command -v bc &> /dev/null; then
        missing_tools+=("bc")
    fi
    
    # Check openssl
    if ! command -v openssl &> /dev/null; then
        missing_tools+=("openssl")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        log_info "Install missing tools:"
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install gh jq bc openssl"
        echo "  macOS: brew install gh jq bc openssl"
        exit 1
    fi
    
    # Check GitHub CLI authentication
    if ! gh auth status &> /dev/null; then
        log_warning "GitHub CLI not authenticated"
        log_info "Run: gh auth login"
        read -p "Continue anyway? (y/N): " continue_anyway
        if [[ $continue_anyway != "y" && $continue_anyway != "Y" ]]; then
            exit 1
        fi
    fi
    
    log_success "All prerequisites met"
}

show_menu() {
    log_header "CI/CD Configuration Menu"
    echo "Choose what to configure:"
    echo ""
    echo "1) 🔐 Configure GitHub Secrets"
    echo "2) 🛡️  Setup Branch Protection"
    echo "3) 🌐 Update Production URLs"
    echo "4) 📊 Setup Codecov Integration"
    echo "5) 🚀 Full Setup (All of the above)"
    echo "6) 📋 Show Configuration Status"
    echo "7) 🧪 Test Configuration"
    echo "8) ❌ Exit"
    echo ""
}

configure_secrets() {
    log_step "Configuring GitHub Secrets"
    
    if [[ -f "$SCRIPT_DIR/setup-github-secrets.sh" ]]; then
        "$SCRIPT_DIR/setup-github-secrets.sh"
    else
        log_error "GitHub secrets script not found"
    fi
}

setup_branch_protection() {
    log_step "Setting up Branch Protection"
    
    if [[ -f "$SCRIPT_DIR/setup-branch-protection.sh" ]]; then
        "$SCRIPT_DIR/setup-branch-protection.sh"
    else
        log_error "Branch protection script not found"
    fi
}

update_production_urls() {
    log_step "Updating Production URLs"
    
    if [[ -f "$SCRIPT_DIR/update-production-urls.sh" ]]; then
        "$SCRIPT_DIR/update-production-urls.sh" --interactive
    else
        log_error "Production URLs script not found"
    fi
}

setup_codecov() {
    log_step "Setting up Codecov Integration"
    
    echo "📊 Codecov Setup Instructions:"
    echo ""
    echo "1. Go to https://codecov.io/"
    echo "2. Sign in with your GitHub account"
    echo "3. Add your repository: ghutttyerrez/SAAS-Personal-Trainer"
    echo "4. Get your upload token"
    echo "5. Add it as a GitHub secret:"
    echo ""
    echo "   gh secret set CODECOV_TOKEN --body 'your-codecov-token' --repo ghutttyerrez/SAAS-Personal-Trainer"
    echo ""
    
    read -p "Have you completed the Codecov setup? (y/N): " codecov_done
    if [[ $codecov_done == "y" || $codecov_done == "Y" ]]; then
        log_success "Codecov setup marked as complete"
        return 0
    else
        log_warning "Codecov setup skipped"
        return 1
    fi
}

full_setup() {
    log_header "Full CI/CD Setup"
    log_info "This will configure all CI/CD components"
    
    read -p "Proceed with full setup? (y/N): " proceed
    if [[ $proceed != "y" && $proceed != "Y" ]]; then
        log_info "Setup cancelled"
        return
    fi
    
    configure_secrets
    echo ""
    
    setup_branch_protection
    echo ""
    
    update_production_urls
    echo ""
    
    setup_codecov
    echo ""
    
    log_success "Full setup completed!"
    show_next_steps
}

show_configuration_status() {
    log_header "Configuration Status"
    
    local repo_owner="ghutttyerrez"
    local repo_name="SAAS-Personal-Trainer"
    
    echo "🔍 Checking current configuration..."
    echo ""
    
    # Check if secrets exist (we can't read their values)
    echo "📋 GitHub Secrets Status:"
    if gh secret list --repo "$repo_owner/$repo_name" &> /dev/null; then
        gh secret list --repo "$repo_owner/$repo_name" | head -10
    else
        echo "  ❌ Cannot access secrets (not authenticated or no permissions)"
    fi
    echo ""
    
    # Check branch protection
    echo "🛡️  Branch Protection Status:"
    if gh api "repos/$repo_owner/$repo_name/branches/main/protection" &> /dev/null; then
        echo "  ✅ Main branch protection is active"
    else
        echo "  ❌ Main branch protection not configured"
    fi
    echo ""
    
    # Check workflows
    echo "🔄 GitHub Actions Workflows:"
    if [[ -d ".github/workflows" ]]; then
        ls -1 .github/workflows/*.yml 2>/dev/null | while read workflow; do
            echo "  ✅ $(basename "$workflow")"
        done
    else
        echo "  ❌ No workflows found"
    fi
    echo ""
    
    # Check if URLs are updated
    echo "🌐 Production URLs Status:"
    if grep -q "your-api-url.com" .github/workflows/monitoring.yml 2>/dev/null; then
        echo "  ❌ URLs not updated (still using placeholders)"
    else
        echo "  ✅ URLs appear to be configured"
    fi
    echo ""
    
    # Check Codecov integration
    echo "📊 Codecov Integration:"
    if grep -q "codecov/codecov-action" .github/workflows/coverage.yml 2>/dev/null; then
        echo "  ✅ Codecov workflow configured"
    else
        echo "  ❌ Codecov workflow not found"
    fi
}

test_configuration() {
    log_header "Testing Configuration"
    
    echo "🧪 Running configuration tests..."
    echo ""
    
    # Test 1: Workflow syntax
    log_info "Test 1: Checking workflow syntax"
    if command -v yamllint &> /dev/null; then
        if yamllint .github/workflows/*.yml; then
            log_success "All workflows have valid syntax"
        else
            log_error "Workflow syntax errors found"
        fi
    else
        log_warning "yamllint not installed, skipping syntax check"
    fi
    echo ""
    
    # Test 2: Script executability
    log_info "Test 2: Checking script permissions"
    local scripts=(
        "scripts/deploy.sh"
        "scripts/setup-github-secrets.sh"
        "scripts/setup-branch-protection.sh"
        "scripts/update-production-urls.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -x "$script" ]]; then
            echo "  ✅ $script is executable"
        else
            echo "  ❌ $script is not executable"
        fi
    done
    echo ""
    
    # Test 3: Docker files
    log_info "Test 3: Checking Docker configurations"
    if [[ -f "apps/api/Dockerfile" ]]; then
        echo "  ✅ API Dockerfile exists"
    else
        echo "  ❌ API Dockerfile missing"
    fi
    
    if [[ -f "apps/web/Dockerfile" ]]; then
        echo "  ✅ Web Dockerfile exists"
    else
        echo "  ❌ Web Dockerfile missing"
    fi
    echo ""
    
    # Test 4: Environment files
    log_info "Test 4: Checking environment configurations"
    local env_files=(
        ".env.development.example"
        ".env.staging.example"
        ".env.production.example"
    )
    
    for env_file in "${env_files[@]}"; do
        if [[ -f "$env_file" ]]; then
            echo "  ✅ $env_file exists"
        else
            echo "  ❌ $env_file missing"
        fi
    done
    
    log_success "Configuration test completed"
}

show_next_steps() {
    log_header "Next Steps"
    
    echo "🎯 Recommended next actions:"
    echo ""
    echo "1. 🔐 Verify GitHub Secrets:"
    echo "   - Go to: https://github.com/ghutttyerrez/SAAS-Personal-Trainer/settings/secrets/actions"
    echo "   - Ensure all required secrets are set"
    echo ""
    echo "2. 🧪 Test the CI/CD Pipeline:"
    echo "   - Create a test branch: git checkout -b test-cicd"
    echo "   - Make a small change and push"
    echo "   - Create a PR and verify all checks pass"
    echo ""
    echo "3. 🌐 Configure DNS and SSL:"
    echo "   - Point your domain to your server"
    echo "   - Set up SSL certificates (Let's Encrypt recommended)"
    echo ""
    echo "4. 📊 Monitor First Deployment:"
    echo "   - Watch GitHub Actions for any issues"
    echo "   - Check application health after deployment"
    echo ""
    echo "5. 📚 Update Documentation:"
    echo "   - Update README with your actual URLs"
    echo "   - Document any custom configurations"
    echo ""
    echo "🔗 Useful Links:"
    echo "   - Repository: https://github.com/ghutttyerrez/SAAS-Personal-Trainer"
    echo "   - Actions: https://github.com/ghutttyerrez/SAAS-Personal-Trainer/actions"
    echo "   - Settings: https://github.com/ghutttyerrez/SAAS-Personal-Trainer/settings"
}

main() {
    cd "$PROJECT_ROOT"
    
    echo -e "${PURPLE}"
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║     CI/CD Configuration Manager       ║"
    echo "  ║     SAAS Personal Trainer             ║"
    echo "  ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    
    while true; do
        echo ""
        show_menu
        read -p "Select option (1-8): " choice
        
        case $choice in
            1)
                configure_secrets
                ;;
            2)
                setup_branch_protection
                ;;
            3)
                update_production_urls
                ;;
            4)
                setup_codecov
                ;;
            5)
                full_setup
                ;;
            6)
                show_configuration_status
                ;;
            7)
                test_configuration
                ;;
            8)
                log_info "Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid option. Please choose 1-8."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

main "$@"
