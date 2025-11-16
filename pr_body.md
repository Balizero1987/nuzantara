## Summary
Add Jakarta Authentic conversational dataset with 1,500 ultra-realistic conversations to the centralized **DATASET_GEMMA** folder.

This is **CLAUDE 12** of 60 prompts generating 24,000 total conversations across 12 Claude instances.

## Dataset Details
**File:** `DATASET_GEMMA/claude12_jakarta_authentic.json`
**Size:** 9.2 MB
**Total Conversations:** 1,500
**Dataset ID:** `jakarta_authentic_claude12`

### Distribution
- ✅ 300 street vendor conversations
- ✅ 300 traditional market conversations
- ✅ 300 kampung community conversations
- ✅ 300 local wisdom conversations
- ✅ 300 Jakarta legends/stories conversations

### Features
- Authentic grassroots Jakarta Indonesian
- Heavy Betawi influences and expressions
- Local particles: dah, mah, doang, kagak, nih, dong
- Traditional expressions and proverbs
- Warm community feeling
- 5-35 messages per conversation
- Complete metadata for each message (emotion, formality, particles, slang, Betawi markers)
- Quality metrics (naturalness, street authenticity, local wisdom, community warmth)

## Changes
1. Created `DATASET_GEMMA/` folder for centralized dataset storage
2. Added `claude12_jakarta_authentic.json` with all 1,500 conversations
3. Updated `.gitignore` to allow JSON files in `DATASET_GEMMA/` folder
4. Added generator script `generate_jakarta_authentic.py`
5. Added validation script `validate_dataset.py`

## Topics Covered
- Street vendors: vegetables, fruits, snacks, traditional foods (nasi uduk, bubur ayam, bakso, soto betawi, kerak telor, etc.)
- Traditional markets: fish, chicken, spices, daily commodities
- Kampung community: gotong royong, arisan, hajatan, mutual aid
- Local wisdom: traditional medicine, cooking tips, life advice, folklore
- Jakarta legends: Si Pitung, Kota Tua ghosts, Monas mysteries, urban legends

## Test Plan
- [x] Generated all 1,500 conversations successfully
- [x] Validated JSON structure
- [x] Verified distribution (300 per category)
- [x] Checked sample conversations for authenticity
- [x] Confirmed Betawi markers and local expressions present
- [x] File accessible in DATASET_GEMMA folder

## Part of Series
This is part of the 60-prompt dataset generation project:
- 12 Claude instances × 5 prompts each = 60 datasets
- ~400 conversations per prompt × 60 = ~24,000 total conversations
- All datasets centralized in `DATASET_GEMMA/` folder for easy access
