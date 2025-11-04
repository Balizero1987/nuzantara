# GitHub Configuration

GitHub Actions workflows and repository configuration.

## 🔄 Workflows

### ci-cd.yml
**Main CI/CD Pipeline**

Triggers: `push`, `pull_request`

Steps:
1. Checkout code
2. Build AMD64 Docker images (ubuntu-latest)
3. Push to Google Container Registry
4. Deploy to Cloud Run
5. Run tests

**Critical**: Uses `ubuntu-latest` for AMD64 builds (fixes re-ranker issue)

### deploy.yml
**Deployment workflow**

Manual deployment trigger for production releases.

### deploy-github-actions.yml
**GitHub Actions deployment**

Automated deployment using GitHub Actions runners.

### a11y.yml
**Accessibility testing**

Runs Pa11y accessibility tests on webapp.

### gitops.yml
**GitOps workflow**

Infrastructure-as-code deployment workflow.

## 🏗️ Configuration

### Secrets Required

The following secrets must be configured in GitHub repository settings:

- `GCP_PROJECT_ID` - Google Cloud project ID
- `GCP_SA_KEY` - Service account key (JSON)
- `DOCKER_REGISTRY` - GCR registry URL
- `CLOUD_RUN_REGION` - Deployment region (europe-west1)

### Branch Protection

**main branch**:
- Require pull request reviews
- Require status checks to pass
- Secret scanning enabled

## 📊 Workflow Stats

- **Total workflows**: 5
- **CI/CD automation**: Yes
- **AMD64 builds**: Yes (fixes re-ranker)
- **Deployment**: Automatic on push to main

## 🚀 Deployment Flow

```
git push → GitHub Actions → Build (AMD64) → GCR → Cloud Run → Live
```

**Duration**: ~3 minutes

---

**Last Updated**: 2025-10-04
