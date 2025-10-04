#!/bin/bash
# Advanced Blue/Green Deployment Script for Zantara Bridge
# Supports both Cloud Run and Kubernetes deployments

set -euo pipefail

# Configuration
PROJECT_ID="${PROJECT_ID:-involuted-box-469105-r0}"
REGION="${REGION:-asia-southeast2}"
SERVICE_PREFIX="zantara-bridge-v4"
DEPLOYMENT_TYPE="${DEPLOYMENT_TYPE:-cloudrun}"  # cloudrun or k8s
IMAGE_TAG="${IMAGE_TAG:-latest}"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    if ! command_exists gcloud; then
        log_error "gcloud CLI not found. Please install Google Cloud SDK."
        exit 1
    fi
    
    if [[ "$DEPLOYMENT_TYPE" == "k8s" ]] && ! command_exists kubectl; then
        log_error "kubectl not found. Please install kubectl for Kubernetes deployments."
        exit 1
    fi
    
    # Validate authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "No active gcloud authentication found. Please run 'gcloud auth login'."
        exit 1
    fi
    
    log_success "Prerequisites validated"
}

# Function to get current active deployment color
get_current_color() {
    if [[ "$DEPLOYMENT_TYPE" == "cloudrun" ]]; then
        # For Cloud Run, check traffic allocation
        current_traffic=$(gcloud run services describe ${SERVICE_PREFIX}-primary \
            --region=$REGION \
            --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")
        
        if [[ "$current_traffic" == *"blue"* ]]; then
            echo "blue"
        elif [[ "$current_traffic" == *"green"* ]]; then
            echo "green"
        else
            echo "blue"  # Default to blue
        fi
    else
        # For Kubernetes, check service selector
        current_selector=$(kubectl get service zantara-bridge-service \
            -n zantara-system \
            -o jsonpath='{.spec.selector.deployment-color}' 2>/dev/null || echo "blue")
        echo "$current_selector"
    fi
}

# Function to get next deployment color
get_next_color() {
    current=$(get_current_color)
    if [[ "$current" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Function to deploy to Cloud Run
deploy_cloudrun() {
    local color=$1
    local service_name="${SERVICE_PREFIX}-${color}"
    
    log_info "Deploying to Cloud Run service: $service_name"
    
    # Build and push image
    local full_image_name="${REGION}-docker.pkg.dev/${PROJECT_ID}/zantara-bridge/zantara-bridge:${IMAGE_TAG}"
    
    log_info "Building and pushing image: $full_image_name"
    gcloud builds submit \
        --project=$PROJECT_ID \
        --config=cloudbuild.yaml \
        --substitutions=_IMAGE_NAME=$full_image_name
    
    # Deploy to Cloud Run
    gcloud run deploy $service_name \
        --image=$full_image_name \
        --region=$REGION \
        --platform=managed \
        --allow-unauthenticated \
        --memory=4Gi \
        --cpu=2 \
        --timeout=300s \
        --concurrency=100 \
        --min-instances=2 \
        --max-instances=100 \
        --set-env-vars="DEPLOYMENT_COLOR=${color},NODE_ENV=production,PORT=8080" \
        --set-secrets="GOOGLE_SERVICE_ACCOUNT_KEY=GOOGLE_SERVICE_ACCOUNT_KEY:latest" \
        --execution-environment=gen2 \
        --cpu-throttling=false \
        --startup-cpu-boost \
        --service-account=zantara-runtime@${PROJECT_ID}.iam.gserviceaccount.com \
        --no-traffic
    
    log_success "Deployed to Cloud Run service: $service_name"
}

# Function to deploy to Kubernetes
deploy_k8s() {
    local color=$1
    local deployment_name="zantara-bridge-${color}"
    
    log_info "Deploying to Kubernetes deployment: $deployment_name"
    
    # Build and push image
    local full_image_name="${REGION}-docker.pkg.dev/${PROJECT_ID}/zantara-bridge/zantara-bridge:${IMAGE_TAG}"
    
    log_info "Building and pushing image: $full_image_name"
    gcloud builds submit \
        --project=$PROJECT_ID \
        --config=cloudbuild.yaml \
        --substitutions=_IMAGE_NAME=$full_image_name
    
    # Update deployment image
    kubectl set image deployment/$deployment_name \
        zantara-bridge=$full_image_name \
        -n zantara-system
    
    # Scale up if it's scaled to zero
    kubectl scale deployment/$deployment_name --replicas=3 -n zantara-system
    
    # Wait for rollout to complete
    kubectl rollout status deployment/$deployment_name -n zantara-system --timeout=600s
    
    log_success "Deployed to Kubernetes deployment: $deployment_name"
}

# Function to perform health check
health_check() {
    local color=$1
    local service_url
    
    if [[ "$DEPLOYMENT_TYPE" == "cloudrun" ]]; then
        service_url=$(gcloud run services describe ${SERVICE_PREFIX}-${color} \
            --region=$REGION \
            --format="value(status.url)")
    else
        # For K8s, use port-forward for testing
        kubectl port-forward service/zantara-bridge-${color}-service 8080:80 -n zantara-system &
        local port_forward_pid=$!
        sleep 5
        service_url="http://localhost:8080"
    fi
    
    log_info "Performing health check on $color deployment: $service_url"
    
    local start_time=$(date +%s)
    local max_time=$((start_time + HEALTH_CHECK_TIMEOUT))
    
    while [[ $(date +%s) -lt $max_time ]]; do
        if curl -sf "$service_url/health" >/dev/null 2>&1; then
            log_success "$color deployment health check passed"
            
            # Clean up port-forward if used
            if [[ "$DEPLOYMENT_TYPE" == "k8s" ]] && [[ -n "${port_forward_pid:-}" ]]; then
                kill $port_forward_pid 2>/dev/null || true
            fi
            
            return 0
        fi
        
        log_warning "Health check failed, retrying in 10 seconds..."
        sleep 10
    done
    
    # Clean up port-forward if used
    if [[ "$DEPLOYMENT_TYPE" == "k8s" ]] && [[ -n "${port_forward_pid:-}" ]]; then
        kill $port_forward_pid 2>/dev/null || true
    fi
    
    log_error "$color deployment health check failed after $HEALTH_CHECK_TIMEOUT seconds"
    return 1
}

# Function to switch traffic
switch_traffic() {
    local new_color=$1
    local old_color=$2
    
    log_info "Switching traffic from $old_color to $new_color"
    
    if [[ "$DEPLOYMENT_TYPE" == "cloudrun" ]]; then
        # For Cloud Run, update traffic allocation gradually
        log_info "Performing gradual traffic switch..."
        
        # 10% to new deployment
        gcloud run services update-traffic ${SERVICE_PREFIX}-primary \
            --to-revisions="${SERVICE_PREFIX}-${new_color}=10,${SERVICE_PREFIX}-${old_color}=90" \
            --region=$REGION
        
        sleep 30
        log_info "10% traffic switched to $new_color"
        
        # 50% to new deployment
        gcloud run services update-traffic ${SERVICE_PREFIX}-primary \
            --to-revisions="${SERVICE_PREFIX}-${new_color}=50,${SERVICE_PREFIX}-${old_color}=50" \
            --region=$REGION
        
        sleep 60
        log_info "50% traffic switched to $new_color"
        
        # 100% to new deployment
        gcloud run services update-traffic ${SERVICE_PREFIX}-primary \
            --to-revisions="${SERVICE_PREFIX}-${new_color}=100" \
            --region=$REGION
        
    else
        # For Kubernetes, update service selector
        kubectl patch service zantara-bridge-service \
            -n zantara-system \
            -p '{"spec":{"selector":{"deployment-color":"'$new_color'"}}}'
        
        # Scale down old deployment gradually
        log_info "Scaling down $old_color deployment"
        kubectl scale deployment/zantara-bridge-${old_color} --replicas=0 -n zantara-system
    fi
    
    log_success "Traffic switched to $new_color deployment"
}

# Function to rollback deployment
rollback_deployment() {
    local failed_color=$1
    local stable_color=$2
    
    log_warning "Rolling back from $failed_color to $stable_color"
    
    if [[ "$DEPLOYMENT_TYPE" == "cloudrun" ]]; then
        gcloud run services update-traffic ${SERVICE_PREFIX}-primary \
            --to-revisions="${SERVICE_PREFIX}-${stable_color}=100" \
            --region=$REGION
    else
        kubectl patch service zantara-bridge-service \
            -n zantara-system \
            -p '{"spec":{"selector":{"deployment-color":"'$stable_color'"}}}'
        
        kubectl scale deployment/zantara-bridge-${stable_color} --replicas=3 -n zantara-system
        kubectl scale deployment/zantara-bridge-${failed_color} --replicas=0 -n zantara-system
    fi
    
    log_success "Rollback completed to $stable_color deployment"
}

# Function to cleanup old deployments
cleanup_old_deployment() {
    local old_color=$1
    
    log_info "Cleaning up old $old_color deployment"
    
    if [[ "$DEPLOYMENT_TYPE" == "cloudrun" ]]; then
        # Scale down old Cloud Run service
        gcloud run services update ${SERVICE_PREFIX}-${old_color} \
            --min-instances=0 \
            --region=$REGION
    else
        # Keep old K8s deployment scaled to 0 for quick rollback
        log_info "Keeping $old_color deployment scaled to 0 for quick rollback"
    fi
    
    log_success "Cleanup completed for $old_color deployment"
}

# Main deployment function
main() {
    log_info "Starting Blue/Green deployment for Zantara Bridge"
    log_info "Deployment type: $DEPLOYMENT_TYPE"
    log_info "Project: $PROJECT_ID"
    log_info "Region: $REGION"
    log_info "Image tag: $IMAGE_TAG"
    
    validate_prerequisites
    
    local current_color=$(get_current_color)
    local next_color=$(get_next_color)
    
    log_info "Current active deployment: $current_color"
    log_info "Deploying to: $next_color"
    
    # Deploy to inactive environment
    if [[ "$DEPLOYMENT_TYPE" == "cloudrun" ]]; then
        deploy_cloudrun $next_color
    else
        deploy_k8s $next_color
    fi
    
    # Health check new deployment
    if ! health_check $next_color; then
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback_deployment $next_color $current_color
        fi
        exit 1
    fi
    
    # Switch traffic to new deployment
    switch_traffic $next_color $current_color
    
    # Final health check after traffic switch
    sleep 30
    if ! health_check $next_color; then
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback_deployment $next_color $current_color
        fi
        exit 1
    fi
    
    # Cleanup old deployment
    cleanup_old_deployment $current_color
    
    log_success "Blue/Green deployment completed successfully!"
    log_success "Active deployment: $next_color"
    
    if [[ "$DEPLOYMENT_TYPE" == "cloudrun" ]]; then
        local service_url=$(gcloud run services describe ${SERVICE_PREFIX}-primary \
            --region=$REGION \
            --format="value(status.url)")
        log_success "Service URL: $service_url"
    else
        log_success "Kubernetes service: zantara-bridge-service.zantara-system.svc.cluster.local"
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    status)
        current_color=$(get_current_color)
        log_info "Current active deployment: $current_color"
        ;;
    rollback)
        current_color=$(get_current_color)
        next_color=$(get_next_color)
        log_warning "Rolling back from $current_color to $next_color"
        switch_traffic $next_color $current_color
        log_success "Rollback completed"
        ;;
    *)
        echo "Usage: $0 {deploy|status|rollback}"
        echo "  deploy   - Perform blue/green deployment"
        echo "  status   - Show current deployment status"
        echo "  rollback - Rollback to previous deployment"
        exit 1
        ;;
esac