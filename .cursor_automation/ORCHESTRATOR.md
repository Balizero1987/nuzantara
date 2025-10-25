# 🤖 CURSOR AUTOMATION ORCHESTRATOR

**Status**: Ready for execution
**Generated**: 2025-10-26
**Target**: Increase test coverage from 15% to 80%+

---

## 📋 Overview

This automation system prepares **68 test generation prompts** for Cursor AI to execute in auto mode. The goal is to generate comprehensive test suites for all 80 handlers in the backend-ts project.

### Current State
- ✅ **AGENTE 1**: Code analysis completed (80 handlers, 12 existing tests)
- ✅ **AGENTE 2**: 68 prompts generated in `/tmp/cursor_automation/prompts/`
- ✅ **AGENTE 3**: Verification scripts created in `/tmp/cursor_automation/scripts/`
- ✅ **AGENTE 4**: Orchestrator setup (this document)

---

## 🚀 Execution Plan

### Phase 1: Start with Priority Prompts (01-10)

These are the **highest priority** handlers to test first:

1. **01_example-modern-handler.md** - Simple starting point
2. **02_bali-zero-oracle.md** - Core business logic
3. **03_ai-services-ai.md** - Critical AI functionality
4. **04_google-workspace-gmail.md** - Email integration
5. **05_memory-memory.md** - Data persistence
6. **06-10**: Google Workspace handlers (Drive, Sheets, Docs, etc.)

**How to execute in Cursor**:

```bash
# Step 1: Open Cursor in the project directory
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

# Step 2: In Cursor, paste the prompt from file 01
cat /tmp/cursor_automation/prompts/01_example-modern-handler.md

# Step 3: Let Cursor auto mode generate the test
# Step 4: Verify it works:
npm test -- example-modern-handler.test

# Step 5: Repeat for prompts 02-10
```

**Expected time**: 5-10 minutes (Cursor auto mode)

---

### Phase 2: Batch Generate Remaining Tests (11-55)

Once the first 10 succeed, batch process the remaining **55 new test prompts**:

**Modules to cover**:
- Communication (WhatsApp, Instagram, Translate)
- Memory (Episodes, Autosave, Cache)
- Analytics (Dashboard, Weekly reports)
- Zantara (Knowledge, Dashboard, Brilliant)
- Intel (News search, Scraper)
- Maps, Identity, Auth
- Admin, System handlers
- Zero (Chat, Chat Simple)
- AI Services (Advanced AI, Bridge, Enhanced, Creative, Llama)

**Batch execution**:
```bash
# Copy prompts 11-20 to Cursor in sequence
for i in {11..20}; do
    echo "Processing prompt $i"
    cat /tmp/cursor_automation/prompts/$(printf "%02d" $i)_*.md
    # Paste in Cursor, wait for completion
done
```

**Expected time**: 30-45 minutes (Cursor auto mode)

---

### Phase 3: Review Existing Tests (56-66)

These prompts are for handlers that **already have tests**. The goal is to **enhance coverage**:

- 56-66: Review and enhance existing tests (Oracle, KBLI, Team, Calendar, etc.)

**How to execute**:
```bash
# Run existing test first
npm test -- oracle.test --coverage

# If coverage < 80%, use the enhancement prompt
cat /tmp/cursor_automation/prompts/56_bali-zero-oracle.md

# Let Cursor enhance the test
# Re-run to verify improvement
npm test -- oracle.test --coverage
```

**Expected time**: 15-20 minutes

---

### Phase 4: Verification & Report (67-68)

Final verification and reporting:

**Prompt 67**: Run all tests and generate coverage report
```bash
cat /tmp/cursor_automation/prompts/67_BATCH_RUN_ALL.md
# Paste in Cursor to execute full test suite
```

**Prompt 68**: Generate final report
```bash
cat /tmp/cursor_automation/prompts/68_FINAL_REPORT.md
# Creates comprehensive completion report
```

**Expected time**: 10-15 minutes

---

## 🛠️ Verification Scripts

After Cursor generates tests, use these scripts to verify quality:

### 1. Quick Verification
```bash
/tmp/cursor_automation/scripts/verify_tests.sh
```
**Output**: Test count, pass/fail status, missing tests list

### 2. Coverage Check by Module
```bash
/tmp/cursor_automation/scripts/check_coverage.sh
```
**Output**: Coverage percentage for each module

### 3. Quick Test Individual Handler
```bash
/tmp/cursor_automation/scripts/quick_test.sh oracle
```
**Output**: Runs specific test with coverage

### 4. Detailed Report
```bash
python3 /tmp/cursor_automation/scripts/generate_report.py
```
**Output**: JSON + Markdown reports with full breakdown

---

## 📊 Success Metrics

### Before (Current State)
- ✅ 12 test files
- ✅ 15% coverage
- ❌ 68 handlers without tests

### Target (After Automation)
- 🎯 68+ test files (80 total)
- 🎯 80%+ coverage
- 🎯 All critical handlers tested

### Critical Handlers (Must be >85% coverage)
1. `bali-zero/oracle.ts` - Core business logic
2. `ai-services/ai.ts` - AI completions
3. `memory/memory.ts` - Data persistence
4. `google-workspace/gmail.ts` - Email integration
5. `auth/team-login-secure.ts` - Authentication

---

## 🔄 Execution Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ START: Open Cursor in project                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Execute prompts 01-10 (Priority handlers)          │
│ → Paste each prompt in Cursor                               │
│ → Let auto mode generate test                               │
│ → Verify: npm test -- <handler-name>                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Batch execute prompts 11-55 (New tests)            │
│ → Process in batches of 10                                  │
│ → Verify after each batch                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Execute prompts 56-66 (Enhance existing)           │
│ → Review existing test coverage                             │
│ → Enhance if < 80%                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Execute prompts 67-68 (Verification)               │
│ → Run full test suite                                       │
│ → Generate final report                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ DONE: Coverage increased from 15% to 80%+ ✅                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Notes for Cursor Execution

### Best Practices

1. **One prompt at a time**: Don't batch all 68 prompts at once
2. **Verify incrementally**: Run `npm test` after every 5-10 test generations
3. **Fix errors immediately**: If a test fails, fix it before continuing
4. **Check coverage**: Use `npm test -- --coverage <test-name>` frequently
5. **Commit progress**: Git commit after each successful batch

### Common Issues

**Issue**: Import errors (`.ts` vs `.js`)
**Fix**: Always use `.js` extension in imports: `await import('../file.js')`

**Issue**: Mock not working
**Fix**: Ensure `jest.mock()` is called BEFORE the import

**Issue**: Firestore mock errors
**Fix**: Use the exact mock structure provided in prompts

**Issue**: Test timeout
**Fix**: Add `jest.setTimeout(10000)` if needed

---

## 🎯 Final Checklist

Before considering the automation complete:

- [ ] All 68 prompts processed
- [ ] `npm test` passes (all tests green)
- [ ] Overall coverage ≥80%
- [ ] Critical handlers ≥85% coverage
- [ ] No obvious test gaps
- [ ] Verification scripts run successfully
- [ ] Final report generated

---

## 📁 File Structure

```
/tmp/cursor_automation/
├── prompts/
│   ├── 01_example-modern-handler.md    # Priority 1
│   ├── 02_bali-zero-oracle.md          # Priority 2
│   ├── 03_ai-services-ai.md            # Priority 3
│   ├── ...
│   ├── 67_BATCH_RUN_ALL.md             # Final verification
│   └── 68_FINAL_REPORT.md              # Completion report
├── scripts/
│   ├── verify_tests.sh                 # Main verification
│   ├── check_coverage.sh               # Module coverage
│   ├── quick_test.sh                   # Single test runner
│   └── generate_report.py              # Detailed reporting
├── reports/
│   ├── analysis.json                   # Initial analysis
│   ├── verification_summary_*.md       # Test results
│   ├── coverage_*.json                 # Coverage data
│   └── detailed_coverage_report.md     # Final report
└── ORCHESTRATOR.md                     # This file
```

---

## 🚀 Ready to Execute!

**Next step**: Open Cursor, navigate to project, and start with prompt 01!

```bash
# Quick start command
cat /tmp/cursor_automation/prompts/01_example-modern-handler.md
```

**Good luck! 🎉**
