# Indonesian Conversational Dataset Generator

Generate authentic, natural Indonesian conversations for fine-tuning language models. Specifically designed for **Jakarta millennial speech patterns** (ages 25-40) with rich particles, slang, and emotional variety.

## 🎯 Project Goals

Transform Gemma2 9B from **67.1/100 naturalness** to **85+/100 naturalness** by training on 20K high-quality Indonesian conversations.

## 📦 What's Included

### 1. Core Generator (`indonesian_conversation_generator.py`)
- **3,500+ word production prompt template**
- 11 customizable parameters (style, topic, length, persona)
- Comprehensive Jakarta millennial linguistic features
- Self-assessment scoring built-in
- Claude API integration

### 2. Quality Analyzer (`conversation_quality_analyzer.py`)
- Particle usage analysis (dong, sih, deh, kok, kan, lho, tuh)
- Slang density measurement (gue/lu, banget, parah, etc.)
- Code-switching detection (English in Indonesian context)
- Emotional variety tracking
- Memory reference detection
- 100-point weighted quality scoring
- Automated recommendations

### 3. Test Generation Script (`generate_test_conversations.py`)
- Generates 10 diverse test conversations
- Coverage matrix:
  - Styles: whatsapp (4), live_conversation (3), consultant_professional (3)
  - Topics: visa_immigration (3), business_legal (3), property_investment (2), cultural_daily (2)
  - Lengths: short (3), medium (4), long (3)
  - All 4 user personas represented
- Rate-limited to avoid API throttling
- JSON output with metadata

### 4. Quality Analysis Script (`analyze_test_quality.py`)
- Analyzes all test conversations
- Aggregate statistics (avg quality, particle coverage, slang density)
- Quality distribution (excellent/good/acceptable/below threshold)
- Detailed text report with recommendations
- JSON output for programmatic analysis

## 🚀 Quick Start

### Prerequisites

```bash
# Python 3.9+
python --version

# Install dependencies (if not already installed)
pip install httpx asyncpg

# Set Anthropic API key
export ANTHROPIC_API_KEY='your-api-key-here'
```

### Step 1: Generate 10 Test Conversations

```bash
cd /home/user/nuzantara/apps/backend-rag/scripts
python generate_test_conversations.py
```

**Expected output:**
- `test_conversations/conversation_001.json` through `conversation_010.json`
- `test_conversations/test_conversations_summary.json`

**Duration:** ~5-10 minutes (with rate limiting)

### Step 2: Analyze Quality

```bash
python analyze_test_quality.py
```

**Expected output:**
- `test_conversations/quality_analysis_report.txt` (human-readable)
- `test_conversations/quality_analysis_detailed.json` (programmatic)
- Console summary with recommendations

### Step 3: Review Results

**Check the quality report:**

```bash
cat test_conversations/quality_analysis_report.txt
```

**Look for:**
- Average quality score (target: 70+/100)
- Particle coverage (target: 40-60%)
- Slang density (target: 10-15%)
- Emotion variety (target: 4-5 unique emotions)

### Step 4: Iterate (if needed)

If quality is below 70/100:

1. Review individual conversation analyses
2. Identify common weaknesses (e.g., low particle usage)
3. Adjust prompt template in `indonesian_conversation_generator.py`
4. Regenerate tests
5. Re-analyze

### Step 5: Full Dataset Generation (20K)

**(To be implemented - see Production Generation section below)**

```bash
python generate_full_dataset.py --size 20000 --batch 100
```

## 📊 Quality Metrics Explained

### 1. Particles (25% weight)
**Jakarta millennial speech requires frequent particle usage for naturalness.**

- **dong** (emphasis): "Iya dong!", "Susah dong kalo gitu"
- **sih** (softener): "Gimana sih?", "Emang gitu sih ya"
- **deh** (agreement): "Udah deh", "Oke deh gue coba"
- **kok** (surprise): "Kok lama banget?", "Kenapa kok gitu?"
- **kan** (seeking agreement): "Udah jelas kan?"
- **lho** (surprise): "Masa sih lho?"
- **tuh** (pointing): "Nah tuh kan"

**Target:** 40-60% of messages should have at least one particle

### 2. Slang Density (20% weight)
**Authentic Jakarta millennial vocabulary.**

Common slang:
- **gue/gw** (I), **lu/lo** (you)
- **banget** (very), **parah** (extreme)
- **santuy** (chill), **kepo** (curious)
- **gapapa** (no problem), **udah** (already)
- **gimana** (how), **kenapa** (why)

**Target:** 10-15% of total words

### 3. Emotional Variety (20% weight)
**Natural conversations show emotional progression.**

Emotions tracked:
- Curious/inquiring
- Worried/concerned
- Relieved
- Excited
- Grateful
- Frustrated

**Target:** 4-5 different emotions per conversation

### 4. Conversation Flow (15% weight)
**Natural turn-taking patterns.**

- Some multi-message bursts (like WhatsApp)
- Not too many consecutive messages from one speaker
- Realistic interruptions and clarifications

### 5. Memory References (10% weight)
**For medium/long conversations, callbacks to earlier messages.**

Examples:
- "Tadi lu bilang soal visa kan..."
- "Balik lagi ke yang gue tanya sebelumnya..."
- "Oh iya bener, hampir lupa"

**Target:** 3-5 references in medium/long conversations

### 6. Code-Switching (10% weight)
**Natural mixing of English in business contexts only.**

Appropriate:
- "Deadline kapan?" (business context)
- "Bisa di-follow up ga?" (professional context)

Inappropriate:
- "How was your weekend?" (should be Indonesian in casual context)

**Target:** 5-10% English terms in business topics, <5% in casual topics

## 🎨 Conversation Styles

### WhatsApp Casual
- Very informal, like texting a friend
- High particle density (50%+)
- High slang (15-20%)
- Short bursts (1-2 sentences per message)
- Multi-message thoughts
- Typos/corrections realistic

**Best for:** Casual queries, daily life questions

### Live Conversation
- Flowing but still casual
- Moderate particles (30-40%)
- Moderate slang (8-12%)
- Longer messages (2-4 sentences)
- Professional warmth
- Clear turn-taking

**Best for:** Initial consultations, exploratory discussions

### Consultant Professional
- Professional but friendly
- Strategic particles (20-30%) for warmth
- Low slang (3-5%)
- More code-switching in business context
- Structured, informative responses
- Still uses gue/lu (Jakarta professional norm)

**Best for:** Detailed consultations, complex topics

## 📝 Topic Domains

### 1. Visa & Immigration
- KITAS/KITAP processes
- Visa types (investor, retirement, business)
- Timeline and document questions
- Bureaucracy concerns

**Emotional arc:** Anxiety → Hope → Relief

### 2. Business & Legal
- PT PMA setup
- Business licensing (NIB, OSS)
- Tax questions (NPWP, PKP)
- Legal compliance

**Emotional arc:** Confusion → Understanding → Confidence

### 3. Property & Investment
- Buying property as foreigner
- Hak Pakai vs Hak Milik
- Investment returns
- Legal restrictions

**Emotional arc:** Excitement → Caution → Strategic thinking

### 4. Cultural & Daily Life
- Cultural adaptation
- Banking, SIM, healthcare
- Social integration
- Living costs

**Emotional arc:** Curiosity → Appreciation → Integration

## 👥 User Personas

### Jakarta Millennial
- Age 28-35, tech/startup professional
- Fluent English but prefers Indonesian
- Very familiar with slang
- Uses particles naturally

### Expat Professional
- Age 30-40, working in Jakarta 2-3 years
- Understanding Indonesian, learning slang
- Mixes English frequently
- Polite but casual

### Mixed Couple
- Indonesian married to foreigner
- Helping partner navigate bureaucracy
- Code-switches naturally
- Familiar with both cultures

### Business Owner
- Age 35-45, entrepreneur
- Professional tone but warm
- Asks detailed questions
- Strategic mindset

## 📈 Expected Results

### Test Dataset (10 conversations)
- **Average quality:** 70-78/100
- **Particle coverage:** 35-45%
- **Slang density:** 8-12%
- **Success rate:** 90%+ conversations pass threshold

### Full Dataset (20K conversations)
Composition:
- **WhatsApp casual:** 8,000 (40%)
- **Live conversation:** 6,000 (30%)
- **Consultant professional:** 4,000 (20%)
- **Mixed styles:** 2,000 (10%)

Topic distribution:
- **Visa/immigration:** 6,000 (30%)
- **Business/legal:** 6,000 (30%)
- **Property/investment:** 4,000 (20%)
- **Cultural/daily:** 4,000 (20%)

Quality thresholds:
- **Min naturalness:** 7/10
- **Min particles per message:** 0.3
- **Min slang density:** 5%
- **Min overall quality:** 65/100

### After Fine-tuning Gemma2 9B
- **Current naturalness:** 67.1/100
- **Target naturalness:** 85+/100
- **Expected improvement:** +26%

## 🔧 Advanced Usage

### Custom Parameters

Modify test parameters in `generate_test_conversations.py`:

```python
TEST_CONVERSATIONS = [
    {
        "id": "custom_001",
        "style": "whatsapp",  # or live_conversation, consultant_professional
        "topic": "visa_immigration",  # or business_legal, property_investment, cultural_daily
        "length": "medium",  # or short, long
        "user_persona": "jakarta_millennial",  # or expat_professional, mixed_couple, business_owner
        "description": "Custom test case"
    }
]
```

### Analyze Single Conversation

```bash
cd /home/user/nuzantara/apps/backend-rag/scripts/modules
python conversation_quality_analyzer.py ../test_conversations/conversation_001.json
```

### Adjust Quality Thresholds

Edit weights in `conversation_quality_analyzer.py`:

```python
weights = {
    "particles": 0.25,      # Increase if particles are critical
    "slang": 0.20,          # Adjust based on formality needs
    "emotions": 0.20,
    "flow": 0.15,
    "memory": 0.10,
    "code_switching": 0.10
}
```

### Extend Prompt Template

Add new linguistic features in `indonesian_conversation_generator.py`:

```python
# Example: Add region-specific slang
REGIONAL_SLANG = {
    "jakarta": ["gue", "lu", "banget"],
    "bandung": ["aing", "sia", "pisan"],
    "surabaya": ["aku", "kamu", "banget"]
}
```

## 🚀 Production Generation

### Full 20K Dataset Generation (To Be Implemented)

**Requirements:**
- Anthropic API key with sufficient credits (~$50-100 estimated)
- 8-10 hours of generation time
- Robust error handling and retry logic
- Progress tracking and checkpointing

**Recommended implementation:**

```python
# generate_full_dataset.py (to be created)
- Batch processing (100 conversations per batch)
- Automatic retry on failures
- Quality filtering (reject <65/100)
- Progress checkpoints every 1000 conversations
- Parallel generation (3-5 concurrent requests)
- Cost tracking and estimation
```

**Monitoring:**
- Track API costs in real-time
- Monitor quality distribution
- Alert if quality drops below threshold
- Save failed generations for review

## 📁 File Structure

```
apps/backend-rag/scripts/
├── modules/
│   ├── indonesian_conversation_generator.py  # Core generator
│   └── conversation_quality_analyzer.py       # Quality analysis
├── generate_test_conversations.py             # Test generation script
├── analyze_test_quality.py                    # Analysis script
├── INDONESIAN_DATASET_GENERATOR_README.md     # This file
└── test_conversations/                        # Output directory
    ├── conversation_001.json
    ├── conversation_002.json
    ├── ...
    ├── test_conversations_summary.json
    ├── quality_analysis_report.txt
    └── quality_analysis_detailed.json
```

## 🐛 Troubleshooting

### API Key Not Found
```bash
export ANTHROPIC_API_KEY='your-key-here'
# Add to ~/.bashrc or ~/.zshrc for persistence
```

### Generation Timeout
- Check network connection
- Increase timeout in `indonesian_conversation_generator.py` (default: 180s)
- Reduce complexity (use "short" length for testing)

### Low Quality Scores
- Review individual conversations to identify patterns
- Check particle and slang lists for completeness
- Ensure prompt template emphasizes naturalness
- Consider regenerating with higher temperature (0.8-0.9)

### JSON Parse Errors
- Claude may occasionally return invalid JSON
- Check response preview in logs
- Add JSON validation/repair logic if needed
- Retry with same parameters

## 📚 References

### Indonesian Linguistic Resources
- Jakarta millennial slang dictionary
- Particle usage in informal Indonesian
- Code-switching patterns in Jakarta

### Model Fine-tuning
- Gemma2 9B fine-tuning guide
- Dataset quality vs model performance correlation
- Indonesian language model benchmarks

## 🤝 Contributing

### Adding New Features

1. **New conversation styles:** Add to `STYLE_INSTRUCTIONS` dict
2. **New topics:** Add to `TOPIC_CONTEXTS` dict
3. **New personas:** Add to `USER_PERSONAS` dict
4. **New quality metrics:** Extend `ConversationQualityAnalyzer` class

### Testing Changes

```bash
# Test single conversation generation
cd modules
python indonesian_conversation_generator.py

# Test quality analysis
python conversation_quality_analyzer.py ../test_conversations/conversation_001.json
```

## 📊 Quality Benchmarks

### Excellent (80-100)
- Ready for production dataset
- High naturalness
- Rich linguistic features
- Authentic Jakarta millennial voice

### Good (70-79)
- Acceptable for dataset with minor improvements
- Some naturalness
- Adequate linguistic features
- Needs minor tweaking

### Acceptable (60-69)
- Marginal quality
- Limited naturalness
- Missing key features
- Requires significant improvement

### Below Threshold (<60)
- Not suitable for dataset
- Unnatural or robotic
- Poor linguistic authenticity
- Major revisions required

## 📞 Support

For issues or questions:
1. Check this README
2. Review test conversation outputs
3. Examine quality analysis reports
4. Consult Claude API documentation

## 🎉 Success Criteria

**Ready for 20K generation when:**
- ✅ Test average quality ≥ 70/100
- ✅ Particle coverage ≥ 35%
- ✅ Slang density 8-15%
- ✅ 90%+ conversations pass quality threshold
- ✅ Native speaker validation (if available)
- ✅ No systematic issues in quality reports

---

**Generated:** 2024-11-16
**Version:** 1.0
**Framework:** BALI ZERO Indonesian Dataset Generator
