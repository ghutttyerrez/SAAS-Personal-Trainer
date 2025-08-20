#!/bin/bash

# ==========================================
# GitHub Secrets Configuration Script
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository info
REPO_OWNER="ghutttyerrez"
REPO_NAME="SAAS-Personal-Trainer"

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

check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI not found. Please install it first:"
        echo "https://github.com/cli/cli#installation"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI not authenticated. Run 'gh auth login' first."
        exit 1
    fi
    
    log_success "GitHub CLI is ready"
}

configure_secrets() {
    log_info "Configuring GitHub Secrets..."
    
    # Database secrets
    log_info "Setting up database secrets..."
    gh secret set POSTGRES_USER --body "pt_prod_user" --repo $REPO_OWNER/$REPO_NAME
    gh secret set POSTGRES_PASSWORD --body "$(openssl rand -base64 32)" --repo $REPO_OWNER/$REPO_NAME
    gh secret set POSTGRES_DB --body "personal_trainer_prod" --repo $REPO_OWNER/$REPO_NAME
    
    # JWT secrets
    log_info "Setting up JWT secrets..."
    gh secret set JWT_SECRET --body "$(openssl rand -base64 64)" --repo $REPO_OWNER/$REPO_NAME
    gh secret set JWT_REFRESH_SECRET --body "$(openssl rand -base64 64)" --repo $REPO_OWNER/$REPO_NAME
    
    # Container Registry
    log_info "Setting up container registry secrets..."
    # O GITHUB_TOKEN já existe automaticamente
    gh secret set REGISTRY --body "ghcr.io" --repo $REPO_OWNER/$REPO_NAME
    gh secret set IMAGE_NAME --body "saas-personal-trainer" --repo $REPO_OWNER/$REPO_NAME
    
    # Monitoring secrets (usuário deve fornecer)
    log_warning "Please set up these secrets manually in GitHub:"
    echo "1. SLACK_WEBHOOK - Your Slack webhook URL"
    echo "2. DISCORD_WEBHOOK - Your Discord webhook URL"
    echo "3. CODECOV_TOKEN - Your Codecov token"
    echo "4. GRAFANA_PASSWORD - Password for Grafana dashboard"
    
    # Production environment
    log_info "Setting up production environment secrets..."
    gh secret set CORS_ORIGIN --body "https://yourapp.com,https://www.yourapp.com" --repo $REPO_OWNER/$REPO_NAME
    gh secret set SMTP_HOST --body "smtp.production.com" --repo $REPO_OWNER/$REPO_NAME
    gh secret set SMTP_USER --body "noreply@yourapp.com" --repo $REPO_OWNER/$REPO_NAME
    gh secret set SMTP_PASS --body "$(openssl rand -base64 24)" --repo $REPO_OWNER/$REPO_NAME
    gh secret set WEBHOOK_SECRET --body "$(openssl rand -base64 32)" --repo $REPO_OWNER/$REPO_NAME
    
    log_success "Basic secrets configured!"
}

configure_environments() {
    log_info "Configuring GitHub Environments..."
    
    # Staging environment
    log_info "Creating staging environment..."
    gh api repos/$REPO_OWNER/$REPO_NAME/environments/staging --method PUT --field wait_timer=0
    
    # Production environment
    log_info "Creating production environment..."
    gh api repos/$REPO_OWNER/$REPO_NAME/environments/production --method PUT --field wait_timer=0
    
    # Add protection rules to production
    log_info "Adding protection rules to production..."
    gh api repos/$REPO_OWNER/$REPO_NAME/environments/production --method PUT \
        --field wait_timer=0 \
        --field prevent_self_review=false \
        --field reviewers='[{"type":"User","id":null}]'
    
    log_success "Environments configured!"
}

show_manual_steps() {
    log_info "Manual steps required:"
    echo ""
    echo "1. 📱 Set up Slack Integration:"
    echo "   - Go to your Slack workspace"
    echo "   - Create a new app and add webhook"
    echo "   - Set SLACK_WEBHOOK secret with the webhook URL"
    echo ""
    echo "2. 🎮 Set up Discord Integration:"
    echo "   - Go to your Discord server settings"
    echo "   - Create webhook in desired channel"
    echo "   - Set DISCORD_WEBHOOK secret with the webhook URL"
    echo ""
    echo "3. 📊 Set up Codecov:"
    echo "   - Go to https://codecov.io/"
    echo "   - Connect your GitHub repository"
    echo "   - Get the token and set CODECOV_TOKEN secret"
    echo ""
    echo "4. 🌐 Update Production URLs:"
    echo "   - Replace 'yourapp.com' with your actual domain"
    echo "   - Update CORS_ORIGIN and other URL-related secrets"
    echo ""
    echo "5. 📧 Configure SMTP:"
    echo "   - Set up your email service (SendGrid, AWS SES, etc.)"
    echo "   - Update SMTP_* secrets with real credentials"
}

main() {
    echo "🔐 GitHub Secrets Configuration"
    echo "Repository: $REPO_OWNER/$REPO_NAME"
    echo ""
    
    check_gh_cli
    configure_secrets
    configure_environments
    show_manual_steps
    
    log_success "Configuration completed!"
    echo ""
    log_info "Next steps:"
    echo "1. Complete manual configurations above"
    echo "2. Run branch protection setup script"
    echo "3. Update production URLs in workflows"
}

main "$@"
