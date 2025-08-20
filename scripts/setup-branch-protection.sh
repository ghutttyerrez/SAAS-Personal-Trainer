#!/bin/bash

# ==========================================
# GitHub Branch Protection Configuration
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

check_prerequisites() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI not found. Please install it first."
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI not authenticated. Run 'gh auth login' first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

configure_main_protection() {
    log_info "Configuring protection rules for main branch..."
    
    # Main branch protection rules
    gh api repos/$REPO_OWNER/$REPO_NAME/branches/main/protection --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["test (api)","test (web)","security","quality-gate"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"require_last_push_approval":false}' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field block_creations=false \
        --field required_conversation_resolution=true
    
    log_success "Main branch protection configured"
}

configure_develop_protection() {
    log_info "Configuring protection rules for develop branch..."
    
    # Check if develop branch exists
    if gh api repos/$REPO_OWNER/$REPO_NAME/branches/develop &> /dev/null; then
        gh api repos/$REPO_OWNER/$REPO_NAME/branches/develop/protection --method PUT \
            --field required_status_checks='{"strict":true,"contexts":["test (api)","test (web)"]}' \
            --field enforce_admins=false \
            --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":false}' \
            --field restrictions=null \
            --field allow_force_pushes=false \
            --field allow_deletions=false \
            --field required_conversation_resolution=false
        
        log_success "Develop branch protection configured"
    else
        log_warning "Develop branch not found. Skipping protection rules."
    fi
}

create_develop_branch() {
    log_info "Creating develop branch if it doesn't exist..."
    
    if ! gh api repos/$REPO_OWNER/$REPO_NAME/branches/develop &> /dev/null; then
        # Get main branch SHA
        MAIN_SHA=$(gh api repos/$REPO_OWNER/$REPO_NAME/git/refs/heads/main --jq '.object.sha')
        
        # Create develop branch
        gh api repos/$REPO_OWNER/$REPO_NAME/git/refs --method POST \
            --field ref="refs/heads/develop" \
            --field sha="$MAIN_SHA"
        
        log_success "Develop branch created"
    else
        log_info "Develop branch already exists"
    fi
}

configure_repository_settings() {
    log_info "Configuring repository settings..."
    
    # Update repository settings
    gh api repos/$REPO_OWNER/$REPO_NAME --method PATCH \
        --field allow_merge_commit=true \
        --field allow_squash_merge=true \
        --field allow_rebase_merge=false \
        --field delete_branch_on_merge=true \
        --field allow_auto_merge=true
    
    # Enable vulnerability alerts
    gh api repos/$REPO_OWNER/$REPO_NAME/vulnerability-alerts --method PUT
    
    # Enable automated security fixes
    gh api repos/$REPO_OWNER/$REPO_NAME/automated-security-fixes --method PUT
    
    log_success "Repository settings configured"
}

setup_branch_ruleset() {
    log_info "Setting up advanced branch ruleset..."
    
    # Create a more comprehensive ruleset
    cat > /tmp/branch-ruleset.json << EOF
{
  "name": "Main Branch Protection",
  "target": "branch",
  "source_type": "Repository",
  "source": "$REPO_OWNER/$REPO_NAME",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          {
            "context": "test (api)",
            "integration_id": null
          },
          {
            "context": "test (web)",
            "integration_id": null
          },
          {
            "context": "security",
            "integration_id": null
          },
          {
            "context": "quality-gate",
            "integration_id": null
          }
        ]
      }
    },
    {
      "type": "non_fast_forward",
      "parameters": {}
    },
    {
      "type": "deletion",
      "parameters": {}
    }
  ],
  "bypass_actors": []
}
EOF

    # Apply ruleset (this might fail if rulesets API is not available)
    if gh api repos/$REPO_OWNER/$REPO_NAME/rulesets --method POST --input /tmp/branch-ruleset.json &> /dev/null; then
        log_success "Advanced branch ruleset configured"
    else
        log_warning "Advanced rulesets not available. Using basic protection rules."
    fi
    
    rm -f /tmp/branch-ruleset.json
}

show_configuration_summary() {
    log_info "Branch Protection Configuration Summary:"
    echo ""
    echo "✅ Main Branch Protection:"
    echo "   - Require pull request reviews (1 approver)"
    echo "   - Dismiss stale reviews on new commits"
    echo "   - Require status checks to pass"
    echo "   - Require conversation resolution"
    echo "   - Prevent force pushes and deletions"
    echo "   - Enforce for administrators"
    echo ""
    echo "✅ Repository Settings:"
    echo "   - Auto-delete merged branches"
    echo "   - Allow auto-merge"
    echo "   - Vulnerability alerts enabled"
    echo "   - Automated security fixes enabled"
    echo ""
    echo "✅ Required Status Checks:"
    echo "   - test (api) - API tests must pass"
    echo "   - test (web) - Web tests must pass"
    echo "   - security - Security scan must pass"
    echo "   - quality-gate - Quality gates must pass"
}

main() {
    echo "🛡️ GitHub Branch Protection Configuration"
    echo "Repository: $REPO_OWNER/$REPO_NAME"
    echo ""
    
    check_prerequisites
    create_develop_branch
    configure_repository_settings
    configure_main_protection
    configure_develop_protection
    setup_branch_ruleset
    show_configuration_summary
    
    log_success "Branch protection configuration completed!"
    echo ""
    log_info "You can view the protection rules at:"
    echo "https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
}

main "$@"
