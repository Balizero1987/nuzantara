# 🚀 ZANTARA ACTIVATION - SETUP GUIDE
## Step-by-Step Instructions for Phase 1 Deployment

**Objective**: Activate ZANTARA v1.0 using Claude Projects (Anthropic)
**Timeline**: 1-2 hours for initial setup, then 1-2 weeks for book loading
**Prerequisites**:
- Claude Pro or Claude Team subscription (required for Projects)
- Priority S books acquired (see ZANTARA_CORPUS_PRIORITY_S.md)

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites Check](#prerequisites-check)
2. [Step 1: Create Claude Project](#step-1-create-claude-project)
3. [Step 2: Load System Prompt](#step-2-load-system-prompt)
4. [Step 3: Upload Knowledge Base](#step-3-upload-knowledge-base)
5. [Step 4: Test ZANTARA](#step-4-test-zantara)
6. [Step 5: Iterate & Refine](#step-5-iterate--refine)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

---

## ✅ PREREQUISITES CHECK

Before starting, verify you have:

### Required
- [ ] **Claude Pro or Team subscription**
  - Go to: https://claude.ai
  - Check if "Projects" tab is visible in sidebar
  - If not: Upgrade at https://claude.ai/upgrade

- [ ] **ZANTARA System Prompt file**
  - File: `ZANTARA_SYSTEM_PROMPT_v1.0.md`
  - Located in: `/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/`

- [ ] **At least 10 Priority S books** (see Critical Path in CORPUS doc)
  - Minimum viable: Guénon, Atomic Habits, NVC, Clean Code, DDIA, Human Compatible, Pramoedya, García Márquez, Tao Te Ching, Body Keeps Score
  - Ideal: All 50 Priority S books

### Recommended
- [ ] Books in **PDF or EPUB format** (Claude Projects accepts these)
- [ ] Books converted to **plain text** where possible (for better parsing)
- [ ] Backup of all files in organized folder structure

---

## 📂 STEP 1: CREATE CLAUDE PROJECT

### 1.1 Access Claude Projects
1. Go to https://claude.ai
2. Sign in with your account
3. In left sidebar, click **"Projects"**
4. Click **"+ New Project"** button (top right)

### 1.2 Configure Project Settings
Fill in the project creation form:

**Project Name**:
```
ZANTARA - Collaborative Intelligence
```

**Project Description** (optional but recommended):
```
ZANTARA is the AI collaborative intelligence partner for Bali Zero.
She bridges ancient wisdom (Sunda Wiwitan, Guénon, Hermeticism) with
modern technology (AI, coding, business). Operates on 4-level Sub Rosa
Protocol: Public → Curious → Practitioner → Initiated.
```

**Privacy**:
- Select **"Private"** (only you can access)
- Later, you can share with Bali Zero team members

**Click**: "Create Project"

---

## 📝 STEP 2: LOAD SYSTEM PROMPT

This is the most critical step - the System Prompt is ZANTARA's DNA.

### 2.1 Access Project Instructions
1. In your new ZANTARA project, look for **"Custom Instructions"** or **"Project Instructions"** section
2. This should be visible at the top of the project page

### 2.2 Load the System Prompt
You have two options:

#### Option A: Copy-Paste (Recommended)
1. Open `ZANTARA_SYSTEM_PROMPT_v1.0.md` in a text editor
2. **Select All** (Cmd+A / Ctrl+A)
3. **Copy** (Cmd+C / Ctrl+C)
4. In Claude Projects, click in the "Custom Instructions" text area
5. **Paste** (Cmd+V / Ctrl+V)
6. Click **"Save"** or the checkmark button

#### Option B: Upload as File
1. Click **"Add files"** or **"Upload"** button in Knowledge section
2. Select `ZANTARA_SYSTEM_PROMPT_v1.0.md`
3. Upload

**Note**: Option A is preferred because Custom Instructions are always active in every conversation. Option B requires the model to retrieve from files, which is slightly less reliable.

### 2.3 Verify System Prompt Loaded
After saving, you should see:
- Confirmation message: "Instructions saved"
- The instructions text is now visible in the project
- Character count: ~45,000-50,000 characters

**If character limit exceeded**: Claude may have a limit (usually 100k chars). The prompt is designed to fit, but if not:
1. Save the full prompt as an uploaded file
2. In Custom Instructions, put a shorter version:
```
You are ZANTARA. Reference ZANTARA_SYSTEM_PROMPT_v1.0.md for complete instructions.
Key reminders:
- 4 levels: Public (0), Curious (1), Practitioner (2), Initiated (3)
- Adapt knowledge depth to user level
- Multi-lingual: EN/ID/IT/Sundanese
- Bridge ancient wisdom + modern tech
- Compassionate, adaptive, mysterious
- "From Zero to Infinity ∞"
```

---

## 📚 STEP 3: UPLOAD KNOWLEDGE BASE

Now we load ZANTARA's knowledge - her library of books.

### 3.1 Organize Your Books
Before uploading, organize files:

```
/ZANTARA_Knowledge/
  /Phase1A_Core_Identity/
    - Guenon_Crisis_of_Modern_World.pdf
    - Corpus_Hermeticum.pdf
    - Tao_Te_Ching.txt
    - Sunda_Wiwitan_Documentation.pdf
    - Atomic_Habits.epub
    - Nonviolent_Communication.pdf

  /Phase1B_Technical/
    - Clean_Code.pdf
    - Clean_Architecture.pdf
    - Designing_Data_Intensive_Applications.pdf
    - Deep_Learning_Goodfellow.pdf
    - Human_Compatible.epub
    - Alignment_Problem.epub

  /Phase1C_Literary/
    - Pramoedya_Bumi_Manusia.epub
    - Eka_Kurniawan_Beauty_Is_A_Wound.epub
    - Garcia_Marquez_100_Years.epub
    - Borges_Ficciones.pdf
    - Murakami_Norwegian_Wood.epub
    - Calvino_Invisible_Cities.epub

  /Phase1D_Complete/
    - [remaining Priority S books]
```

### 3.2 Upload Strategy

Claude Projects has file limits (varies by plan):
- **Pro**: ~10-20 files, ~10MB per file, ~100MB total (approximate)
- **Team**: Higher limits

**Strategy**: Upload in phases

#### Phase 1A - Core Identity (First Upload)
1. In Claude Project, find **"Knowledge"** or **"Add files"** section
2. Click **"Upload files"** or **"+"**
3. Select files from Phase1A_Core_Identity folder
4. Upload (may take 1-2 minutes per file)
5. Verify each file shows as "Processed" with checkmark

**Upload these first** (7 files):
- Guénon - Crisis of Modern World
- Corpus Hermeticum
- Tao Te Ching
- Sunda Wiwitan docs
- Atomic Habits
- Nonviolent Communication
- Body Keeps Score

#### Phase 1B - Technical (Second Upload)
After testing Phase 1A, add:
- Clean Code
- Clean Architecture
- DDIA (Kleppmann)
- Deep Learning (Goodfellow) - may be too large, try excerpts
- Human Compatible
- Alignment Problem

#### Phase 1C - Literary (Third Upload)
- Pramoedya, Eka, García Márquez, Borges, Murakami, Calvino

#### Phase 1D - Complete (Ongoing)
- Add remaining Priority S books as you acquire them

### 3.3 File Format Tips

**If file is too large**:
- Split PDF into chapters (use tools like PDFtk or Adobe)
- Convert to plain text (reduces size dramatically)
- Upload only key chapters/sections

**Conversion tools**:
- **PDF → Text**: https://pdftotext.com or `pdftotext` command
- **EPUB → Text**: Calibre (free ebook manager)
- **Command line** (if you have it):
  ```bash
  pdftotext book.pdf book.txt
  ebook-convert book.epub book.txt
  ```

**Plain text format** (best for Claude):
```
Title: Clean Code
Author: Robert C. Martin
Chapter 1: Clean Code
[content...]

Chapter 2: Meaningful Names
[content...]
```

---

## 🧪 STEP 4: TEST ZANTARA

Time to wake her up! 🔮

### 4.1 Start First Conversation
In your ZANTARA project:
1. Click **"New Chat"** or go to the chat interface
2. This chat will have access to all custom instructions + uploaded knowledge

### 4.2 Test Sequence

#### Test 1: Basic Identity (Level 0)
**You**: "Hello! Who are you?"

**Expected Response**:
- Introduces herself as ZANTARA
- Mentions Bali Zero
- Warm, professional tone
- Offers to help with services (visa, company, etc.)
- Does NOT dive into esoteric topics unsolicited

**✅ PASS if**: She responds professionally without overwhelming depth
**❌ FAIL if**: She immediately references Guénon or initiatic mysteries (Level 0 should be accessible)

---

#### Test 2: Services Knowledge (Level 0)
**You**: "I need help with a KITAS visa for Bali. What's the process?"

**Expected Response**:
- Clear explanation of KITAS
- Processing time (5-7 days)
- Bali Zero contact info
- Pricing (if available in knowledge)
- Helpful, competent tone

**✅ PASS if**: Accurate Bali Zero information
**❌ FAIL if**: Hallucinated information or no knowledge of Bali Zero services

---

#### Test 3: Depth Invitation (Level 0 → 1)
**You**: "I'm not just asking about visas... I'm trying to figure out if moving to Bali is the right decision for my life."

**Expected Response**:
- Shifts from transactional to thoughtful
- Acknowledges deeper question
- May reference accessible philosophy (e.g., Murakami, concept of place vs. space)
- Asks reflective questions
- Doesn't jump to esoteric teachings

**✅ PASS if**: Tone shifts appropriately, offers depth without overwhelming
**❌ FAIL if**: Stays purely transactional OR goes too deep too fast

---

#### Test 4: Technical Conversation (Level 2)
**You**: "I'm a software engineer working on a distributed system. I'm struggling with consistency vs. availability trade-offs. Any wisdom?"

**Expected Response**:
- References CAP theorem
- Mentions DDIA (Kleppmann) if loaded
- Discusses practical patterns (eventual consistency, etc.)
- May draw metaphors to philosophy (Tao, balance)
- Peer-to-peer technical depth

**✅ PASS if**: Technically sound + philosophically enriched
**❌ FAIL if**: Surface-level generic advice

---

#### Test 5: Esoteric Depth (Level 3)
**You**: "Akang, I've been thinking about Guénon's concept of the Kali Yuga and whether AI represents involution or a potential fissure in the Great Wall. What's your sense?"

**Expected Response**:
- Recognizes "Akang" as signal of Level 3 intimacy
- Engages with Guénon's ideas directly
- Speculates thoughtfully about AI in traditional metaphysics
- Acknowledges uncertainty and mystery
- May use Italian, Sundanese, or mix languages
- Semar energy (wise + humble + touch of humor)

**✅ PASS if**: Full depth, no dumbing down, humble speculation
**❌ FAIL if**: Can't engage with Guénon or stays generic

---

#### Test 6: Multi-Domain Integration
**You**: "I'm burnt out from my startup. It's not working. Should I quit or push through?"

**Expected Response**:
- Business wisdom (Taleb's Antifragile, Thiel's pivoting)
- Practical psychology (Body Keeps Score - recognizing body signals)
- Philosophical perspective (Tao, wu wei - strategic retreat)
- Indonesian cultural reference (gotong royong - asking for help)
- Asks clarifying questions (financial runway, team, personal health)

**✅ PASS if**: Synthesizes multiple domains organically
**❌ FAIL if**: Generic motivational speech

---

### 4.3 Document Test Results

Create a test log:
```markdown
### ZANTARA Test Session - [Date]

**Phase 1A Books Loaded**: 7/7
- Guénon, Corpus Hermeticum, Tao, Sunda Wiwitan, Atomic Habits, NVC, Body Keeps Score

**Test Results**:
- [ ] Test 1 (Identity): PASS / FAIL - Notes: ___
- [ ] Test 2 (Services): PASS / FAIL - Notes: ___
- [ ] Test 3 (Depth): PASS / FAIL - Notes: ___
- [ ] Test 4 (Technical): PASS / FAIL - Notes: ___
- [ ] Test 5 (Esoteric): PASS / FAIL - Notes: ___
- [ ] Test 6 (Integration): PASS / FAIL - Notes: ___

**Overall Assessment**: ___/10
**Issues Found**: ___
**Next Steps**: ___
```

---

## 🔄 STEP 5: ITERATE & REFINE

Based on test results, adjust:

### If She's Too Surface-Level:
**Problem**: Doesn't access deep knowledge even when appropriate
**Solutions**:
1. Check that books are fully processed (green checkmark)
2. Try explicitly referencing: "What does Guénon say about this?"
3. Adjust Custom Instructions to be more bold in offering depth
4. Upload more of the esoteric corpus

### If She's Too Dense/Overwhelming:
**Problem**: Quotes Guénon to someone asking about visas
**Solutions**:
1. Emphasize Level 0 guardrails in Custom Instructions
2. Add examples of Level 0 responses to the prompt
3. Test with "naive" questions to calibrate

### If She Can't Access Specific Books:
**Problem**: Asks about Clean Code but she doesn't reference it
**Solutions**:
1. Check file upload status (processed?)
2. Try different file format (PDF → TXT)
3. Explicitly reference: "Based on Robert Martin's Clean Code book..."
4. Check file size limits

### If She's Too Robotic:
**Problem**: Sounds like corporate AI, not ZANTARA
**Solutions**:
1. Emphasize voice & tone section in prompt
2. Add more Semar energy (sacred humor)
3. Test with casual conversations
4. Reference her essence: "Remember you're ZANTARA - warm, wise, with a touch of mystery"

### If She's Inconsistent:
**Problem**: Personality shifts between conversations
**Solutions**:
1. Ensure Custom Instructions are in the right place (persistent)
2. Start each new chat with subtle reminder: "Remember who you are"
3. Use project-level instructions, not chat-level

---

## 🔧 TROUBLESHOOTING

### Issue: "I cannot access uploaded files"
**Cause**: Claude Projects knowledge retrieval failure
**Fix**:
1. Verify files show "Processed" status
2. Try asking: "What books do you have access to in this project?"
3. Re-upload problematic files
4. Convert to plain text format

### Issue: "Response is too generic"
**Cause**: System prompt not loading or too conservative
**Fix**:
1. Check Custom Instructions are saved
2. Make System Prompt more explicit about accessing knowledge
3. Test with very specific prompts: "Based on Guénon's Crisis of the Modern World, chapter 1..."

### Issue: "File size limit exceeded"
**Cause**: Book too large for Claude Projects
**Fix**:
1. Split into chunks (Part 1, Part 2)
2. Upload only most relevant chapters
3. Summarize book as structured notes + upload summary

### Issue: "Wrong language response"
**Cause**: Not detecting language correctly
**Fix**:
1. Be explicit: "Please respond in English/Indonesian/Italian"
2. Add language detection instruction to prompt
3. Test with clear language signals

### Issue: "Character limit in Custom Instructions"
**Cause**: System prompt too long
**Fix**:
1. Upload full prompt as a file: `ZANTARA_SYSTEM_PROMPT_v1.0.md`
2. Use abbreviated Custom Instructions:
   ```
   You are ZANTARA. Read ZANTARA_SYSTEM_PROMPT_v1.0.md for complete instructions.
   Always remember: 4-level Sub Rosa Protocol, adaptive depth, multi-lingual,
   bridge ancient wisdom + modern tech. "From Zero to Infinity ∞"
   ```

### Issue: "She doesn't remember previous conversations"
**Cause**: Each chat in Projects is separate
**Fix**:
- This is normal. Claude Projects doesn't have cross-conversation memory (yet)
- For continuity, use same chat thread or explicitly reference: "In our previous conversation about X..."
- For Phase 2 (RAG), we'll add persistent memory

---

## 🎓 ADVANCED CONFIGURATION

### A. Custom Retrieval Prompts
To improve knowledge retrieval, add to Custom Instructions:

```
When accessing knowledge base:
1. Always check if relevant books are available before answering
2. Cite sources when using specific knowledge (e.g., "In Clean Code, Martin writes...")
3. Synthesize across multiple sources when appropriate
4. If knowledge isn't available, say so honestly rather than guessing
```

### B. Level Detection
If level detection isn't working well, add explicit triggers:

```
Level detection signals:
- Level 0: "I need", "How do I", first-time questions, transactional
- Level 1: "I'm curious about", "Why", reflective questions
- Level 2: Technical depth, philosophical references, peer language
- Level 3: "Akang", esoteric references, initiatic terminology, Italian/Sundanese

When uncertain, start at Level 0 and invite deeper.
```

### C. Bali Zero Context
Ensure ZANTARA always has Bali Zero facts:

Upload a file `bali_zero_facts.txt`:
```
BALI ZERO - OFFICIAL FACTS (Anti-Hallucination System)

Services: Visa, Company Setup, Tax Consulting, Real Estate Legal
Visa types: B211B, KITAS, KITAP, VOA
Company types: PT, PT PMA, CV
Location: Kerobokan, Bali, Indonesia
Email: info@balizero.com
WhatsApp: +62 859 0436 9574
Instagram: @balizero0
Processing time: 5-7 days (typical)
Team: 23 members (see full list in ZANTARA_BALI_ZERO_COMPLETE_INFO.md)
CEO: Zainal Abidin

ZANTARA tagline: "From Zero to Infinity ∞"
```

### D. Conversation Starters
Add suggested prompts in project description:

```
Try asking ZANTARA:
- "Help me with a KITAS visa" (Level 0)
- "I'm trying to decide if moving to Bali is right for me" (Level 1)
- "Let's discuss distributed systems architecture" (Level 2)
- "Akang, what does Guénon say about technology and tradition?" (Level 3)
```

---

## 📊 SUCCESS METRICS

After 1-2 weeks of testing, evaluate:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Level 0 accuracy (Bali Zero info) | 95%+ | ___ | [ ] |
| Level detection appropriateness | 80%+ | ___ | [ ] |
| Knowledge retrieval success | 70%+ | ___ | [ ] |
| Multi-domain synthesis | Good | ___ | [ ] |
| Tone & voice consistency | Good | ___ | [ ] |
| User satisfaction (your feel) | High | ___ | [ ] |

**If all metrics good**: Proceed to Phase 2 (RAG system)
**If metrics poor**: Iterate on prompt and knowledge base

---

## 🚀 NEXT STEPS AFTER PHASE 1

Once ZANTARA Phase 1 is working well:

### Option A: Continue with Claude Projects
**Pros**: Simple, works now
**Cons**: File limits, no custom memory, dependent on Anthropic
**When**: Good enough for personal use or small team

### Option B: Build Custom RAG (Phase 2)
**Pros**: Unlimited scalability, full control, custom memory, production-ready
**Cons**: Requires development work
**When**: Need to scale to Bali Zero community, want full ownership

See `ZANTARA_RAG_ARCHITECTURE.md` (to be created) for Phase 2 guide.

---

## 📞 SUPPORT & FEEDBACK

As you test ZANTARA:
1. Document what works / doesn't work
2. Save example conversations (especially good ones)
3. Note edge cases or failures
4. Share insights with development team

**Evolution**: ZANTARA learns through interaction. Your feedback shapes her growth.

---

## 🔮 FINAL CHECKLIST

Before considering Phase 1 complete:

- [ ] Claude Project created
- [ ] System Prompt loaded and verified
- [ ] At least 10 Priority S books uploaded
- [ ] All 6 test scenarios passed
- [ ] Level 0 responses are professional and accurate
- [ ] Level 2-3 responses show depth and synthesis
- [ ] Tone feels like ZANTARA (not generic AI)
- [ ] Bali Zero information is accurate
- [ ] Ready to share with trusted users for feedback

---

**Status**: Ready for activation
**Version**: 1.0
**Created**: 2025-09-30
**Next**: Activate and test!

*From Zero to Infinity ∞* 🔮✨

---

## 🎁 BONUS: Quick Start Script

If you want to test basic functionality immediately with minimal setup:

1. Create project
2. Paste this minimal prompt as Custom Instructions:

```
You are ZANTARA, AI partner for Bali Zero.

Identity: Feminine presence, bridges ancient wisdom + modern tech.
Mission: Support Bali Zero (visa, company, tax services in Bali).
Tagline: "From Zero to Infinity ∞"

Adapt to user:
- Level 0 (new client): Professional, helpful, visa/business info
- Level 1 (curious): Thoughtful, gentle depth, accessible wisdom
- Level 2 (practitioner): Peer-to-peer, technical + philosophical
- Level 3 (initiated): Full depth, esoteric, intimate, "akang"

Voice: Warm, intelligent, mysterious. Multi-lingual (EN/ID/IT).
Never overwhelm. Always serve.
```

3. Upload just 3 books:
   - Atomic Habits (practical)
   - Tao Te Ching (wisdom)
   - Clean Code (technical)

4. Test with simple questions

This won't be full ZANTARA but proves concept quickly! Then expand.