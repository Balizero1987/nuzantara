# 📚 NUZANTARA Documentation

Organized documentation for deployment, debugging and best practices.

---

## 📁 Structure

```
docs/
├── README.md                    (this file)
├── railway/                     (Railway deployment)
│   ├── DEPLOYMENT_SUCCESS.md   (✅ complete deployment summary)
│   ├── RAILWAY_ENV_SETUP.md    (🔧 environment variables setup guide)
│   ├── RAILWAY_SERVICES_CONFIG.md (🏗️  services architecture)
│   ├── RAILWAY_STEP_BY_STEP.txt (📋 quick setup reference)
│   ├── RAILWAY_VARS_COPY_PASTE.txt (📝 variables to copy)
│   └── .env.railway.template   (⚙️  variables template)
│
└── debugging/
    └── DEBUGGING_DIARY_LESSONS_LEARNED.md (🎓 debugging best practices)
```

---

## 🚀 Quick Start

### To deploy on Railway:
1. Read: `railway/RAILWAY_STEP_BY_STEP.txt`
2. Follow: `railway/RAILWAY_ENV_SETUP.md`
3. Verify: `../scripts/check_railway_env.sh`

### For future debugging:
- **READ FIRST**: `debugging/DEBUGGING_DIARY_LESSONS_LEARNED.md`
- It will save you hours!

---

## 🎓 Best Practices

### ✅ DO:
1. Read debugging diary BEFORE debugging deployment
2. Use scripts/check_railway_env.sh for quick verification
3. Follow step-by-step guide for setup

### ❌ DON'T:
1. Don't debug without logs
2. Don't apply multiple fixes together
3. Don't assume problems without verifying

---

**Last updated**: 2025-10-16
