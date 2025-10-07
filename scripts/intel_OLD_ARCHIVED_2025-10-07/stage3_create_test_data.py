#!/usr/bin/env python3
"""
STAGE 3: Test Script - Create Sample Data for Testing
======================================================

Creates sample scraped files to test LLAMA processing

Author: ZANTARA Team
Created: 2025-10-07
"""

from pathlib import Path
from datetime import datetime
import json


def create_test_data():
    """Create sample scraped data for testing"""
    
    # Sample content for immigration
    immigration_content = """# New KITAS Regulations Announced

**Source**: https://www.imigrasi.go.id/news/new-regulations-2025
**Scraped**: 2025-10-07T10:00:00
**Category**: 01_immigration

---

The Directorate General of Immigration announced significant changes to KITAS (Limited Stay Permit) regulations, effective March 1, 2025.

## Key Changes

Director Yasonna Laoly announced the following updates:

1. **Online Application Mandatory**: All KITAS applications must now be submitted through the online portal at imigrasi.go.id
2. **Biometric Requirements**: New biometric data collection for all applicants at designated immigration offices in Jakarta, Bali, and Surabaya
3. **Processing Time**: Reduced from 30 days to 14 working days
4. **Fee Structure**: Remains at 3,500,000 IDR for initial application

## Affected Categories

These changes apply to:
- E28A Investor KITAS
- B211A Work KITAS  
- C317 Retirement KITAS
- Family reunification KITAS

## Important Deadlines

All current KITAS holders must:
- Complete biometric registration by February 15, 2025
- Submit renewal applications before March 1, 2025 for expiries in Q2 2025
- Attend mandatory orientation at immigration office

## What Expats Need to Do

The Ministry of Law and Human Rights emphasizes that failure to comply with the new biometric requirements will result in visa cancellation. Expats in Bali should visit the Ngurah Rai immigration office in Denpasar to schedule their biometric appointment.

For more information, contact the immigration hotline at 021-1234567 or visit your nearest immigration office.
"""

    # Sample content for AI technology
    ai_content = """# OpenAI Announces GPT-5 with Advanced Reasoning

**Source**: https://openai.com/blog/gpt-5-announcement
**Scraped**: 2025-10-07T11:00:00
**Category**: 12_ai_technology

---

OpenAI today unveiled GPT-5, the latest iteration of its large language model, featuring breakthrough advances in reasoning capabilities.

## Key Features

The new model demonstrates:

- **Advanced Reasoning**: 10x improvement on complex problem-solving benchmarks
- **Multi-modal Native**: Built-in support for text, images, video, and code
- **Reduced Hallucinations**: 80% reduction in factual errors vs GPT-4
- **Explainable AI**: Can provide step-by-step reasoning for its decisions

## Technical Specifications

- Training: 15 trillion tokens across diverse datasets
- Parameters: Estimated 1.8 trillion (not officially confirmed)
- Context window: 1 million tokens (128x larger than GPT-4)
- Latency: Sub-100ms for most queries

## Pricing and Availability

- API Access: Q1 2026
- Pricing: $0.01 per 1K input tokens, $0.03 per 1K output tokens
- Free tier: 1M tokens/month for developers

## Industry Impact

Experts predict GPT-5 will enable new applications in:
- Scientific research and discovery
- Advanced code generation and debugging
- Medical diagnosis and treatment planning
- Strategic business planning

Sam Altman, CEO of OpenAI, stated: "GPT-5 represents a fundamental leap in AI capabilities, bringing us closer to artificial general intelligence."

The announcement has sent ripples through the tech industry, with competitors Anthropic and Google expected to accelerate their own model releases.
"""

    # Create test directories
    base_dir = Path("THE SCRAPING/scraped")
    
    # Immigration test data
    immigration_dir = base_dir / "01_immigration" / "raw"
    immigration_dir.mkdir(parents=True, exist_ok=True)
    
    (immigration_dir / "2025-10-07_new_kitas_regulations.md").write_text(immigration_content)
    (immigration_dir / "2025-10-07_new_kitas_regulations.meta.json").write_text(json.dumps({
        "url": "https://www.imigrasi.go.id/news/new-regulations-2025",
        "title": "New KITAS Regulations Announced",
        "category": "01_immigration",
        "scraped_at": "2025-10-07T10:00:00",
        "word_count": len(immigration_content.split()),
        "content_hash": "abc123def456"
    }, indent=2))
    
    # AI Technology test data
    ai_dir = base_dir / "12_ai_technology" / "raw"
    ai_dir.mkdir(parents=True, exist_ok=True)
    
    (ai_dir / "2025-10-07_gpt5_announcement.md").write_text(ai_content)
    (ai_dir / "2025-10-07_gpt5_announcement.meta.json").write_text(json.dumps({
        "url": "https://openai.com/blog/gpt-5-announcement",
        "title": "OpenAI Announces GPT-5 with Advanced Reasoning",
        "category": "12_ai_technology",
        "scraped_at": "2025-10-07T11:00:00",
        "word_count": len(ai_content.split()),
        "content_hash": "xyz789uvw012"
    }, indent=2))
    
    print("✅ Test data created!")
    print(f"\n📁 Immigration test: {immigration_dir}")
    print(f"   - 2025-10-07_new_kitas_regulations.md")
    print(f"   - 2025-10-07_new_kitas_regulations.meta.json")
    
    print(f"\n📁 AI Technology test: {ai_dir}")
    print(f"   - 2025-10-07_gpt5_announcement.md")
    print(f"   - 2025-10-07_gpt5_announcement.meta.json")
    
    print("\n🚀 Now run:")
    print("   python scripts/intel/stage3_llama_processor.py")


if __name__ == "__main__":
    create_test_data()
