# Zantara Bridge Enterprise Infrastructure
# Provider configuration with advanced features
terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
  
  backend "gcs" {
    bucket = "zantara-terraform-state"
    prefix = "infrastructure/state"
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "involuted-box-469105-r0"
}

variable "primary_region" {
  description = "Primary deployment region"
  type        = string
  default     = "asia-southeast2"
}

variable "backup_regions" {
  description = "Backup regions for disaster recovery"
  type        = list(string)
  default     = ["us-central1", "europe-west1"]
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.primary_region
}

provider "google-beta" {
  project = var.project_id
  region  = var.primary_region
}

# Data sources
data "google_project" "project" {
  project_id = var.project_id
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "artifactregistry.googleapis.com",
    "compute.googleapis.com",
    "dns.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "secretmanager.googleapis.com",
    "firestore.googleapis.com",
    "cloudscheduler.googleapis.com",
    "storage-api.googleapis.com",
    "iam.googleapis.com"
  ])
  
  project = var.project_id
  service = each.key
  
  disable_dependent_services = false
  disable_on_destroy         = false
}

# Artifact Registry for container images
resource "google_artifact_registry_repository" "zantara_registry" {
  provider = google-beta
  
  location      = var.primary_region
  repository_id = "zantara-bridge"
  description   = "Zantara Bridge container registry"
  format        = "DOCKER"
  
  labels = {
    environment = var.environment
    team        = "platform"
  }
  
  depends_on = [google_project_service.apis]
}

# Service accounts with minimal permissions
resource "google_service_account" "zantara_runtime" {
  account_id   = "zantara-runtime"
  display_name = "Zantara Bridge Runtime Service Account"
  description  = "Service account for Zantara Bridge runtime operations"
}

resource "google_service_account" "zantara_cicd" {
  account_id   = "zantara-cicd"
  display_name = "Zantara Bridge CI/CD Service Account"
  description  = "Service account for Zantara Bridge CI/CD operations"
}

resource "google_service_account" "zantara_backup" {
  account_id   = "zantara-backup"
  display_name = "Zantara Bridge Backup Service Account"
  description  = "Service account for backup and disaster recovery operations"
}

# IAM bindings with principle of least privilege
resource "google_project_iam_member" "runtime_permissions" {
  for_each = toset([
    "roles/firestore.user",
    "roles/secretmanager.secretAccessor",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
    "roles/storage.objectViewer"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.zantara_runtime.email}"
}

resource "google_project_iam_member" "cicd_permissions" {
  for_each = toset([
    "roles/run.admin",
    "roles/artifactregistry.writer",
    "roles/cloudbuild.builds.builder",
    "roles/iam.serviceAccountUser"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.zantara_cicd.email}"
}

resource "google_project_iam_member" "backup_permissions" {
  for_each = toset([
    "roles/firestore.admin",
    "roles/storage.admin",
    "roles/secretmanager.admin",
    "roles/artifactregistry.reader"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.zantara_backup.email}"
}

# Global static IP for load balancer
resource "google_compute_global_address" "zantara_lb_ip" {
  name         = "zantara-bridge-lb-ip"
  address_type = "EXTERNAL"
  description  = "Global IP for Zantara Bridge load balancer"
}

# Cloud Storage buckets for backups and static assets
resource "google_storage_bucket" "backups" {
  name     = "zantara-secure-backups-${var.environment}"
  location = "ASIA"
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "backup"
  }
}

resource "google_storage_bucket" "secrets_backup" {
  name     = "zantara-secrets-backup-${var.environment}"
  location = "ASIA"
  
  uniform_bucket_level_access = true
  
  encryption {
    default_kms_key_name = google_kms_crypto_key.backup_key.id
  }
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 180
    }
    action {
      type = "Delete"
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "secrets"
  }
}

# KMS for encryption
resource "google_kms_key_ring" "zantara_keyring" {
  name     = "zantara-keyring"
  location = var.primary_region
}

resource "google_kms_crypto_key" "backup_key" {
  name            = "zantara-backup-key"
  key_ring        = google_kms_key_ring.zantara_keyring.id
  rotation_period = "2592000s" # 30 days
  
  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }
  
  lifecycle {
    prevent_destroy = true
  }
}

# VPC Network for advanced networking (if needed)
resource "google_compute_network" "zantara_vpc" {
  name                    = "zantara-vpc"
  auto_create_subnetworks = false
  description             = "VPC network for Zantara Bridge"
}

resource "google_compute_subnetwork" "zantara_subnet" {
  for_each = toset(concat([var.primary_region], var.backup_regions))
  
  name          = "zantara-subnet-${each.key}"
  ip_cidr_range = each.key == var.primary_region ? "10.0.1.0/24" : "10.0.${index(var.backup_regions, each.key) + 2}.0/24"
  region        = each.key
  network       = google_compute_network.zantara_vpc.id
  
  private_ip_google_access = true
  
  log_config {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Firewall rules for security
resource "google_compute_firewall" "allow_health_checks" {
  name    = "allow-health-checks"
  network = google_compute_network.zantara_vpc.name
  
  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }
  
  source_ranges = [
    "130.211.0.0/22",
    "35.191.0.0/16"
  ]
  
  target_tags = ["zantara-bridge"]
}

resource "google_compute_firewall" "allow_internal" {
  name    = "allow-internal"
  network = google_compute_network.zantara_vpc.name
  
  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }
  
  allow {
    protocol = "icmp"
  }
  
  source_ranges = ["10.0.0.0/8"]
  target_tags   = ["zantara-bridge"]
}

# Cloud Scheduler for backup automation
resource "google_cloud_scheduler_job" "backup_job" {
  name        = "zantara-backup-scheduler"
  description = "Automated backup job for Zantara Bridge"
  schedule    = "0 */4 * * *" # Every 4 hours
  time_zone   = "Asia/Jakarta"
  
  pubsub_target {
    topic_name = google_pubsub_topic.backup_trigger.id
    data       = base64encode("{\"action\":\"backup\",\"timestamp\":\"${timestamp()}\"}")
  }
  
  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "backup_trigger" {
  name = "zantara-backup-trigger"
  
  labels = {
    environment = var.environment
    purpose     = "backup"
  }
}

# Monitoring and alerting
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "Zantara Bridge High Error Rate"
  combiner     = "OR"
  enabled      = true
  
  conditions {
    display_name = "High 5xx error rate"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"zantara-bridge-v2-prod\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.05
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = [
    google_monitoring_notification_channel.email.name
  ]
  
  alert_strategy {
    auto_close = "1800s"
  }
}

resource "google_monitoring_notification_channel" "email" {
  display_name = "Zantara SRE Email"
  type         = "email"
  
  labels = {
    email_address = "sre@zantara.com"
  }
  
  enabled = true
}

# DNS zone for custom domain (if needed)
resource "google_dns_managed_zone" "zantara_zone" {
  name        = "zantara-zone"
  dns_name    = "zantara.com."
  description = "DNS zone for Zantara Bridge"
  
  dnssec_config {
    state = "on"
  }
  
  labels = {
    environment = var.environment
  }
}

# Outputs
output "artifact_registry_url" {
  description = "URL of the Artifact Registry repository"
  value       = "${var.primary_region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.zantara_registry.repository_id}"
}

output "runtime_service_account_email" {
  description = "Email of the runtime service account"
  value       = google_service_account.zantara_runtime.email
}

output "cicd_service_account_email" {
  description = "Email of the CI/CD service account"
  value       = google_service_account.zantara_cicd.email
}

output "backup_bucket_name" {
  description = "Name of the backup storage bucket"
  value       = google_storage_bucket.backups.name
}

output "global_ip_address" {
  description = "Global IP address for load balancer"
  value       = google_compute_global_address.zantara_lb_ip.address
}

output "vpc_network_id" {
  description = "ID of the VPC network"
  value       = google_compute_network.zantara_vpc.id
}