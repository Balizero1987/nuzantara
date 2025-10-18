# Frontend UI Handover

> **What This Tracks**: Webapp UI files and changes
> **Created**: 2025-10-05 by sonnet-4.5_m3

## Current State

**Main Pages**:
- index.html → redirect to login.html
- login.html → ZANTARA authentication
- dashboard.html → main app
- **intel-dashboard.html** → NEW: Intelligence dashboard (chat + blog)

**Deployment**: GitHub Pages (auto-sync via workflow)
**URL**: https://zantara.balizero.com

---

## History

### 2025-10-05 21:00 (bali-intel-system) [sonnet-4.5_m3]

**Changed**:
- `apps/webapp/intel-dashboard.html:1-450` - NEW: Intelligence dashboard
  - Left: Chat interface for ZANTARA intel queries
  - Right: Blog sidebar with daily intelligence articles
  - Responsive design (desktop + mobile)
  - Calls /intel.news.search API
  - Real-time blog updates

**Related**:
→ Full session: [2025-10-05_sonnet-4.5_m3.md](./../diaries/2025-10-05_sonnet-4.5_m3.md)

---
