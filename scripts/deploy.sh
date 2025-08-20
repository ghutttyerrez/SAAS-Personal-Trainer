#!/bin/bash

# ==========================================
# Deployment Script for SAAS Personal Trainer
# ==========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGISTRY=${REGISTRY:-ghcr.io}
IMAGE_NAME=${IMAGE_NAME:-saas-personal-trainer}

# Functions
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
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! docker --version >/dev/null 2>&1; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! docker-compose --version >/dev/null 2>&1; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if required environment files exist
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
            log_error "Production environment file (.env.production) not found"
            exit 1
        fi
    fi
    
    log_success "All prerequisites met"
}

build_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build API image
    log_info "Building API image..."
    docker build \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse HEAD)" \
        -t "${REGISTRY}/${IMAGE_NAME}-api:${VERSION}" \
        -t "${REGISTRY}/${IMAGE_NAME}-api:latest" \
        ./apps/api
    
    # Build Web image
    log_info "Building Web image..."
    docker build \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse HEAD)" \
        -t "${REGISTRY}/${IMAGE_NAME}-web:${VERSION}" \
        -t "${REGISTRY}/${IMAGE_NAME}-web:latest" \
        ./apps/web
    
    log_success "Images built successfully"
}

run_tests() {
    log_info "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci
    
    # Run linting
    log_info "Running linting..."
    npm run lint --workspace @personal-trainer/api || {
        log_error "API linting failed"
        exit 1
    }
    
    npm run lint --workspace @personal-trainer/web || {
        log_error "Web linting failed"
        exit 1
    }
    
    # Run tests
    log_info "Running unit tests..."
    npm run test --workspace @personal-trainer/api || {
        log_error "API tests failed"
        exit 1
    }
    
    # Check test coverage
    log_info "Checking test coverage..."
    cd apps/api
    npm run test:coverage
    
    # Parse coverage and check threshold
    coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    threshold=70
    
    if (( $(echo "$coverage < $threshold" | bc -l) )); then
        log_error "Test coverage ($coverage%) is below threshold ($threshold%)"
        exit 1
    fi
    
    log_success "Coverage ($coverage%) meets threshold ($threshold%)"
    log_success "All tests passed"
}

deploy() {
    log_info "Deploying to $ENVIRONMENT environment..."
    
    cd "$PROJECT_ROOT"
    
    case "$ENVIRONMENT" in
        "development")
            deploy_development
            ;;
        "staging")
            deploy_staging
            ;;
        "production")
            deploy_production
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

deploy_development() {
    log_info "Starting development environment..."
    
    # Stop existing containers
    docker-compose -f docker-compose.dev.yml down
    
    # Start services
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be healthy
    wait_for_health "development"
    
    log_success "Development environment is running"
    log_info "API: http://localhost:3001"
    log_info "Web: http://localhost:3000"
    log_info "Database: localhost:5432"
}

deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Load staging environment variables
    if [[ -f ".env.staging" ]]; then
        export $(cat .env.staging | xargs)
    fi
    
    # Tag images for staging
    docker tag "${REGISTRY}/${IMAGE_NAME}-api:${VERSION}" "${REGISTRY}/${IMAGE_NAME}-api:staging"
    docker tag "${REGISTRY}/${IMAGE_NAME}-web:${VERSION}" "${REGISTRY}/${IMAGE_NAME}-web:staging"
    
    # Deploy with docker-compose
    COMPOSE_FILE="docker-compose.staging.yml"
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    docker-compose -f "$COMPOSE_FILE" down
    docker-compose -f "$COMPOSE_FILE" up -d
    
    wait_for_health "staging"
    
    log_success "Staging deployment completed"
}

deploy_production() {
    log_info "Deploying to production environment..."
    
    # Load production environment variables
    if [[ -f ".env.production" ]]; then
        export $(cat .env.production | xargs)
    fi
    
    # Backup current deployment
    backup_production
    
    # Tag images for production
    docker tag "${REGISTRY}/${IMAGE_NAME}-api:${VERSION}" "${REGISTRY}/${IMAGE_NAME}-api:production"
    docker tag "${REGISTRY}/${IMAGE_NAME}-web:${VERSION}" "${REGISTRY}/${IMAGE_NAME}-web:production"
    
    # Rolling update
    docker-compose -f docker-compose.prod.yml up -d --no-deps api
    
    # Wait for API to be healthy
    wait_for_service_health "api" "http://localhost:3001/api/health"
    
    # Update web service
    docker-compose -f docker-compose.prod.yml up -d --no-deps web
    
    # Wait for web to be healthy
    wait_for_service_health "web" "http://localhost/health"
    
    # Cleanup old images
    cleanup_old_images
    
    log_success "Production deployment completed"
}

backup_production() {
    log_info "Creating production backup..."
    
    # Backup database
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
        -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "${BACKUP_DIR}/database.sql"
    
    # Backup current deployment configuration
    cp docker-compose.prod.yml "${BACKUP_DIR}/"
    cp .env.production "${BACKUP_DIR}/" 2>/dev/null || true
    
    log_success "Backup created in $BACKUP_DIR"
}

wait_for_health() {
    local env="$1"
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose ps | grep -q "Up (healthy)"; then
            log_success "All services are healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Services failed to become healthy within timeout"
    docker-compose logs
    exit 1
}

wait_for_service_health() {
    local service="$1"
    local health_url="$2"
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service to be healthy..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f "$health_url" >/dev/null 2>&1; then
            log_success "$service is healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for $service..."
        sleep 10
        ((attempt++))
    done
    
    log_error "$service failed to become healthy within timeout"
    exit 1
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove old images (keep last 3 versions)
    docker images "${REGISTRY}/${IMAGE_NAME}-api" --format "table {{.Tag}}" | \
        grep -v TAG | sort -rV | tail -n +4 | \
        xargs -r docker rmi "${REGISTRY}/${IMAGE_NAME}-api:" 2>/dev/null || true
    
    docker images "${REGISTRY}/${IMAGE_NAME}-web" --format "table {{.Tag}}" | \
        grep -v TAG | sort -rV | tail -n +4 | \
        xargs -r docker rmi "${REGISTRY}/${IMAGE_NAME}-web:" 2>/dev/null || true
    
    # Remove dangling images
    docker image prune -f
    
    log_success "Cleanup completed"
}

rollback() {
    local rollback_version="$1"
    
    if [[ -z "$rollback_version" ]]; then
        log_error "Rollback version not specified"
        exit 1
    fi
    
    log_warning "Rolling back to version $rollback_version..."
    
    # Tag rollback images
    docker tag "${REGISTRY}/${IMAGE_NAME}-api:${rollback_version}" "${REGISTRY}/${IMAGE_NAME}-api:latest"
    docker tag "${REGISTRY}/${IMAGE_NAME}-web:${rollback_version}" "${REGISTRY}/${IMAGE_NAME}-web:latest"
    
    # Redeploy
    deploy
    
    log_success "Rollback to $rollback_version completed"
}

show_help() {
    echo "Usage: $0 [ENVIRONMENT] [VERSION] [COMMAND]"
    echo ""
    echo "ENVIRONMENT: development, staging, production (default: staging)"
    echo "VERSION: Docker image version tag (default: latest)"
    echo ""
    echo "Commands:"
    echo "  deploy    - Full deployment (default)"
    echo "  build     - Build Docker images only"
    echo "  test      - Run tests only"
    echo "  rollback  - Rollback to specified version"
    echo "  help      - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 staging v1.2.3"
    echo "  $0 production v1.2.3 deploy"
    echo "  $0 development latest build"
    echo "  $0 production v1.2.2 rollback"
}

# Main execution
main() {
    local command="${3:-deploy}"
    
    case "$command" in
        "build")
            check_prerequisites
            build_images
            ;;
        "test")
            run_tests
            ;;
        "deploy")
            check_prerequisites
            run_tests
            build_images
            deploy
            ;;
        "rollback")
            check_prerequisites
            rollback "$VERSION"
            ;;
        "help")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"
