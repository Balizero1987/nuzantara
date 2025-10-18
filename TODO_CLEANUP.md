# NUZANTARA CLEANUP TODO

## 🎯 Goal: Simplify project organization from 8/10 to 10/10

## 📂 SCRIPTS CONSOLIDATION (1354→~50 files)

### ✅ Progress
- [ ] Create intel/ directory for INTEL_SCRAPING
- [ ] Consolidate test scripts
- [ ] Organize deployment scripts
- [ ] Archive obsolete scripts

### 📁 Target Structure
```
scripts/
├── intel/           ← All INTEL_SCRAPING (1000+ files)
├── deploy/          ← Deployment scripts (already organized)
├── test/            ← Test scripts
├── monitoring/      ← Already good
├── setup/           ← Already good
├── utils/           ← Already good
└── archive/         ← Obsolete scripts
```

## 📚 DOCS STREAMLINING (43→~10 files)

### ✅ Progress  
- [ ] Keep essential docs
- [ ] Archive detailed documentation
- [ ] Consolidate guides

### 📁 Target Structure
```
docs/
├── README.md        ← Main guide
├── QUICK_START.md   ← Getting started
├── api/             ← API docs
└── archive/         ← Everything else
```

## 🧹 FINAL CLEANUP

### ✅ Progress
- [ ] Remove .DS_Store files
- [ ] Check .gitignore completeness
- [ ] Verify build outputs