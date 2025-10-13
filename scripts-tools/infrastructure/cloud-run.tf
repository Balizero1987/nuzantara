# Cloud Run deployment configuration with blue/green support
# Primary region deployment
resource "google_cloud_run_v2_service" "zantara_primary" {
  name     = "zantara-bridge-v4-primary"
  location = var.primary_region
  
  template {
    labels = {
      environment = var.environment
      version     = "blue"
      region      = var.primary_region
    }
    
    annotations = {
      "autoscaling.knative.dev/maxScale"                = "100"
      "autoscaling.knative.dev/minScale"                = "2"
      "run.googleapis.com/execution-environment"        = "gen2"
      "run.googleapis.com/cpu-throttling"               = "false"
      "run.googleapis.com/startup-cpu-boost"            = "true"
      "run.googleapis.com/vpc-access-connector"         = google_vpc_access_connector.connector.id
      "run.googleapis.com/vpc-access-egress"            = "private-ranges-only"
    }
    
    service_account = google_service_account.zantara_runtime.email
    
    scaling {
      max_instance_count = 100
      min_instance_count = 2
    }
    
    containers {
      name  = "zantara-bridge"
      image = "${google_artifact_registry_repository.zantara_registry.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.zantara_registry.repository_id}/zantara-bridge:latest"
      
      resources {
        limits = {
          cpu    = "2000m"
          memory = "4Gi"
        }
        
        cpu_idle = true
        startup_cpu_boost = true
      }
      
      ports {
        name           = "http1"
        container_port = 8080
      }
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "PORT"
        value = "8080"
      }
      
      env {
        name  = "REGION"
        value = var.primary_region
      }
      
      env {
        name  = "DEPLOYMENT_COLOR"
        value = "blue"
      }
      
      env {
        name = "GOOGLE_SERVICE_ACCOUNT_KEY"
        value_source {
          secret_key_ref {
            secret  = "GOOGLE_SERVICE_ACCOUNT_KEY"
            version = "latest"
          }
        }
      }
      
      env {
        name  = "AMBARADAM_DRIVE_ID"
        value = "0AJC3-SJL03OOUk9PVA"
      }
      
      env {
        name  = "IMPERSONATE_USER"
        value = "zero@balizero.com"
      }
      
      startup_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 3
        failure_threshold     = 5
        
        http_get {
          path = "/health"
          port = 8080
        }
      }
      
      liveness_probe {
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
        
        http_get {
          path = "/health"
          port = 8080
        }
      }
    }
  }
  
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
  
  depends_on = [
    google_project_service.apis,
    google_vpc_access_connector.connector
  ]
}

# Green deployment for blue/green strategy
resource "google_cloud_run_v2_service" "zantara_green" {
  name     = "zantara-bridge-v4-green"
  location = var.primary_region
  
  template {
    labels = {
      environment = var.environment
      version     = "green"
      region      = var.primary_region
    }
    
    annotations = {
      "autoscaling.knative.dev/maxScale"                = "100"
      "autoscaling.knative.dev/minScale"                = "0"
      "run.googleapis.com/execution-environment"        = "gen2"
      "run.googleapis.com/cpu-throttling"               = "false"
      "run.googleapis.com/startup-cpu-boost"            = "true"
      "run.googleapis.com/vpc-access-connector"         = google_vpc_access_connector.connector.id
      "run.googleapis.com/vpc-access-egress"            = "private-ranges-only"
    }
    
    service_account = google_service_account.zantara_runtime.email
    
    scaling {
      max_instance_count = 100
      min_instance_count = 0
    }
    
    containers {
      name  = "zantara-bridge"
      image = "${google_artifact_registry_repository.zantara_registry.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.zantara_registry.repository_id}/zantara-bridge:latest"
      
      resources {
        limits = {
          cpu    = "2000m"
          memory = "4Gi"
        }
        
        cpu_idle = true
        startup_cpu_boost = true
      }
      
      ports {
        name           = "http1"
        container_port = 8080
      }
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "PORT"
        value = "8080"
      }
      
      env {
        name  = "REGION"
        value = var.primary_region
      }
      
      env {
        name  = "DEPLOYMENT_COLOR"
        value = "green"
      }
      
      env {
        name = "GOOGLE_SERVICE_ACCOUNT_KEY"
        value_source {
          secret_key_ref {
            secret  = "GOOGLE_SERVICE_ACCOUNT_KEY"
            version = "latest"
          }
        }
      }
      
      env {
        name  = "AMBARADAM_DRIVE_ID"
        value = "0AJC3-SJL03OOUk9PVA"
      }
      
      env {
        name  = "IMPERSONATE_USER"
        value = "zero@balizero.com"
      }
      
      startup_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 3
        failure_threshold     = 5
        
        http_get {
          path = "/health"
          port = 8080
        }
      }
      
      liveness_probe {
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
        
        http_get {
          path = "/health"
          port = 8080
        }
      }
    }
  }
  
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 0  # Initially no traffic to green
  }
  
  depends_on = [
    google_project_service.apis,
    google_vpc_access_connector.connector
  ]
}

# Backup region deployments
resource "google_cloud_run_v2_service" "zantara_backup" {
  for_each = toset(var.backup_regions)
  
  name     = "zantara-bridge-v4-backup-${each.key}"
  location = each.key
  
  template {
    labels = {
      environment = var.environment
      version     = "backup"
      region      = each.key
    }
    
    annotations = {
      "autoscaling.knative.dev/maxScale"         = "50"
      "autoscaling.knative.dev/minScale"         = "0"
      "run.googleapis.com/execution-environment" = "gen2"
      "run.googleapis.com/cpu-throttling"        = "false"
    }
    
    service_account = google_service_account.zantara_runtime.email
    
    scaling {
      max_instance_count = 50
      min_instance_count = 0
    }
    
    containers {
      name  = "zantara-bridge"
      image = "${google_artifact_registry_repository.zantara_registry.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.zantara_registry.repository_id}/zantara-bridge:latest"
      
      resources {
        limits = {
          cpu    = "2000m"
          memory = "4Gi"
        }
        
        cpu_idle = true
      }
      
      ports {
        name           = "http1"
        container_port = 8080
      }
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "PORT"
        value = "8080"
      }
      
      env {
        name  = "REGION"
        value = each.key
      }
      
      env {
        name  = "DISASTER_RECOVERY_MODE"
        value = "true"
      }
      
      env {
        name = "GOOGLE_SERVICE_ACCOUNT_KEY"
        value_source {
          secret_key_ref {
            secret  = "GOOGLE_SERVICE_ACCOUNT_KEY"
            version = "latest"
          }
        }
      }
      
      env {
        name  = "AMBARADAM_DRIVE_ID"
        value = "0AJC3-SJL03OOUk9PVA"
      }
      
      env {
        name  = "IMPERSONATE_USER"
        value = "zero@balizero.com"
      }
      
      startup_probe {
        initial_delay_seconds = 15
        timeout_seconds       = 10
        period_seconds        = 5
        failure_threshold     = 5
        
        http_get {
          path = "/health"
          port = 8080
        }
      }
      
      liveness_probe {
        initial_delay_seconds = 60
        timeout_seconds       = 10
        period_seconds        = 30
        failure_threshold     = 3
        
        http_get {
          path = "/health"
          port = 8080
        }
      }
    }
  }
  
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 0  # Only activated during disaster recovery
  }
  
  depends_on = [google_project_service.apis]
}

# VPC Access Connector for private networking
resource "google_vpc_access_connector" "connector" {
  name          = "zantara-vpc-connector"
  region        = var.primary_region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.zantara_vpc.name
  
  min_throughput = 200
  max_throughput = 1000
  
  depends_on = [google_project_service.apis]
}

# IAM bindings for Cloud Run services
resource "google_cloud_run_service_iam_binding" "public_access" {
  for_each = {
    primary = google_cloud_run_v2_service.zantara_primary.name
    green   = google_cloud_run_v2_service.zantara_green.name
  }
  
  location = var.primary_region
  service  = each.value
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

resource "google_cloud_run_service_iam_binding" "backup_public_access" {
  for_each = google_cloud_run_v2_service.zantara_backup
  
  location = each.value.location
  service  = each.value.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

# Output URLs
output "primary_service_url" {
  description = "URL of the primary Cloud Run service"
  value       = google_cloud_run_v2_service.zantara_primary.uri
}

output "green_service_url" {
  description = "URL of the green Cloud Run service"
  value       = google_cloud_run_v2_service.zantara_green.uri
}

output "backup_service_urls" {
  description = "URLs of backup Cloud Run services"
  value       = { for k, v in google_cloud_run_v2_service.zantara_backup : k => v.uri }
}