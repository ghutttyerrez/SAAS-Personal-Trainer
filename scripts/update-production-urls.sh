#!/bin/bash

# ==========================================
# Update Production URLs in Workflows
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values - CHANGE THESE
DEFAULT_DOMAIN="yourapp.com"
DEFAULT_API_URL="your-api-url.com"
DEFAULT_WEB_URL="your-web-url.com"

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

get_user_input() {
    echo "🌐 Production URLs Configuration"
    echo "Please provide your production URLs:"
    echo ""
    
    read -p "🌍 Main domain (e.g., myapp.com): " DOMAIN
    read -p "🔗 API URL (e.g., api.myapp.com): " API_URL
    read -p "🖥️  Web URL (e.g., app.myapp.com or www.myapp.com): " WEB_URL
    read -p "📧 SMTP Host (e.g., smtp.sendgrid.net): " SMTP_HOST
    read -p "✉️  From Email (e.g., noreply@myapp.com): " FROM_EMAIL
    
    # Use defaults if empty
    DOMAIN=${DOMAIN:-$DEFAULT_DOMAIN}
    API_URL=${API_URL:-$DEFAULT_API_URL}
    WEB_URL=${WEB_URL:-$DEFAULT_WEB_URL}
    SMTP_HOST=${SMTP_HOST:-"smtp.production.com"}
    FROM_EMAIL=${FROM_EMAIL:-"noreply@$DOMAIN"}
    
    echo ""
    log_info "Configuration:"
    echo "Domain: $DOMAIN"
    echo "API URL: $API_URL"
    echo "Web URL: $WEB_URL"
    echo "SMTP Host: $SMTP_HOST"
    echo "From Email: $FROM_EMAIL"
    echo ""
    
    read -p "Proceed with these URLs? (y/N): " CONFIRM
    if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
        log_error "Configuration cancelled"
        exit 1
    fi
}

update_monitoring_workflow() {
    log_info "Updating monitoring workflow URLs..."
    
    local file=".github/workflows/monitoring.yml"
    
    # Update health check URLs
    sed -i "s|https://your-api-url.com/health|https://$API_URL/api/health|g" "$file"
    sed -i "s|https://your-web-url.com|https://$WEB_URL|g" "$file"
    
    # Update API endpoints
    sed -i "s|https://your-api-url.com|https://$API_URL|g" "$file"
    
    log_success "Monitoring workflow updated"
}

update_cicd_workflow() {
    log_info "Updating CI/CD workflow URLs..."
    
    local file=".github/workflows/ci-cd.yml"
    
    # Update deployment verification URLs
    sed -i "s|https://your-production-url.com|https://$WEB_URL|g" "$file"
    
    log_success "CI/CD workflow updated"
}

update_pr_validation_workflow() {
    log_info "Updating PR validation workflow..."
    
    local file=".github/workflows/pr-validation.yml"
    
    # Update any URLs in PR validation if needed
    # (Currently doesn't have production URLs, but future-proofing)
    
    log_success "PR validation workflow checked"
}

update_lighthouse_config() {
    log_info "Updating Lighthouse configuration..."
    
    local file="lighthouserc.js"
    
    # Create updated lighthouse config with real URLs
    cat > "$file" << EOF
module.exports = {
  ci: {
    collect: {
      url: [
        'https://$WEB_URL',
        'https://$WEB_URL/login',
        'https://$WEB_URL/dashboard',
        'https://$WEB_URL/clients',
        'https://$WEB_URL/workouts'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 2000 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'interactive': ['error', { maxNumericValue: 5000 }],
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'tabindex': 'error',
        
        // Best practices
        'uses-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        
        // SEO
        'meta-description': 'error',
        'document-title': 'error',
        'robots-txt': 'warn',
        
        // PWA
        'service-worker': 'warn',
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
EOF
    
    log_success "Lighthouse configuration updated"
}

update_environment_files() {
    log_info "Updating environment example files..."
    
    # Update staging environment
    sed -i "s|https://staging.yourapp.com|https://staging.$DOMAIN|g" .env.staging.example
    sed -i "s|noreply@yourapp.com|$FROM_EMAIL|g" .env.staging.example
    sed -i "s|smtp.example.com|$SMTP_HOST|g" .env.staging.example
    
    # Update production environment
    sed -i "s|https://yourapp.com,https://www.yourapp.com|https://$WEB_URL,https://www.$DOMAIN|g" .env.production.example
    sed -i "s|noreply@yourapp.com|$FROM_EMAIL|g" .env.production.example
    sed -i "s|smtp.production.com|$SMTP_HOST|g" .env.production.example
    
    log_success "Environment files updated"
}

update_docker_compose() {
    log_info "Updating Docker Compose configurations..."
    
    # Update nginx configuration if needed
    if [[ -f "apps/web/nginx.conf" ]]; then
        sed -i "s|server_name localhost|server_name $WEB_URL|g" apps/web/nginx.conf
    fi
    
    log_success "Docker configurations updated"
}

update_readme() {
    log_info "Updating README with production URLs..."
    
    # Update badges and URLs in README
    sed -i "s|https://your-production-url.com|https://$WEB_URL|g" README.md
    sed -i "s|yourapp.com|$DOMAIN|g" README.md
    
    log_success "README updated"
}

create_environment_secrets_script() {
    log_info "Creating script to update GitHub secrets with URLs..."
    
    cat > scripts/update-production-secrets.sh << 'EOF'
#!/bin/bash

# Auto-generated script to update production secrets
# Generated by update-production-urls.sh

REPO_OWNER="ghutttyerrez"
REPO_NAME="SAAS-Personal-Trainer"

EOF

    cat >> scripts/update-production-secrets.sh << EOF
# Production URLs
DOMAIN="$DOMAIN"
API_URL="$API_URL"
WEB_URL="$WEB_URL"
SMTP_HOST="$SMTP_HOST"
FROM_EMAIL="$FROM_EMAIL"

# Update GitHub secrets
gh secret set CORS_ORIGIN --body "https://\$WEB_URL,https://www.\$DOMAIN" --repo \$REPO_OWNER/\$REPO_NAME
gh secret set SMTP_HOST --body "\$SMTP_HOST" --repo \$REPO_OWNER/\$REPO_NAME
gh secret set SMTP_USER --body "\$FROM_EMAIL" --repo \$REPO_OWNER/\$REPO_NAME

echo "✅ Production secrets updated with real URLs"
EOF
    
    chmod +x scripts/update-production-secrets.sh
    
    log_success "Production secrets update script created"
}

show_summary() {
    log_info "URL Update Summary:"
    echo ""
    echo "✅ Updated Files:"
    echo "   - .github/workflows/monitoring.yml"
    echo "   - .github/workflows/ci-cd.yml"
    echo "   - lighthouserc.js"
    echo "   - .env.staging.example"
    echo "   - .env.production.example"
    echo "   - apps/web/nginx.conf"
    echo "   - README.md"
    echo ""
    echo "🔧 Configuration Applied:"
    echo "   - Domain: $DOMAIN"
    echo "   - API URL: https://$API_URL"
    echo "   - Web URL: https://$WEB_URL"
    echo "   - SMTP Host: $SMTP_HOST"
    echo "   - From Email: $FROM_EMAIL"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Run: ./scripts/update-production-secrets.sh"
    echo "   2. Update DNS records to point to your servers"
    echo "   3. Configure SSL certificates"
    echo "   4. Test the updated URLs"
}

main() {
    echo "🌐 Production URLs Configuration Script"
    echo ""
    
    if [[ "$1" == "--interactive" ]]; then
        get_user_input
    else
        log_warning "Running with default URLs. Use --interactive for custom URLs."
        DOMAIN=$DEFAULT_DOMAIN
        API_URL=$DEFAULT_API_URL
        WEB_URL=$DEFAULT_WEB_URL
        SMTP_HOST="smtp.production.com"
        FROM_EMAIL="noreply@$DOMAIN"
    fi
    
    update_monitoring_workflow
    update_cicd_workflow
    update_pr_validation_workflow
    update_lighthouse_config
    update_environment_files
    update_docker_compose
    update_readme
    create_environment_secrets_script
    show_summary
    
    log_success "Production URLs configuration completed!"
}

main "$@"
