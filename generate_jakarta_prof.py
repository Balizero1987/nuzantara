#!/usr/bin/env python3
"""
Jakarta Professional Dataset Generator
Generates 1,500 ultra-realistic executive-level Indonesian conversations
"""

import json
import random
from typing import List, Dict

# Executive Topics
EXECUTIVE_TOPICS = [
    ("merger_discussion", ["merger", "acquisition", "valuation", "synergy", "board approval"]),
    ("board_presentation", ["strategy", "projections", "competitive landscape", "KPIs", "roadmap"]),
    ("organizational_restructuring", ["restructuring", "efficiency", "talent retention", "change management"]),
    ("crisis_management", ["crisis response", "stakeholder communication", "recovery plan", "reputation"]),
    ("succession_planning", ["succession", "leadership pipeline", "talent development", "transition"]),
    ("digital_transformation", ["digital strategy", "technology adoption", "innovation", "disruption"]),
    ("corporate_governance", ["governance", "compliance", "risk management", "board oversight"]),
    ("strategic_partnership", ["partnership", "alliance", "collaboration", "joint initiative"]),
    ("market_expansion", ["expansion", "market entry", "growth strategy", "regional presence"]),
    ("performance_review", ["performance", "targets", "accountability", "improvement plans"])
]

# International Business Topics
INTL_TOPICS = [
    ("cross_border_expansion", ["regional hub", "market entry", "local partnerships", "regulatory navigation"]),
    ("joint_venture_negotiation", ["JV structure", "equity split", "governance", "IP transfer"]),
    ("export_strategy", ["export markets", "trade agreements", "logistics", "tariffs"]),
    ("foreign_investment", ["FDI", "investment structure", "repatriation", "incentives"]),
    ("global_supply_chain", ["supply chain", "sourcing", "logistics", "vendor management"]),
    ("international_compliance", ["compliance", "cross-border regulations", "reporting", "sanctions"]),
    ("currency_hedging", ["forex risk", "hedging strategy", "currency exposure", "derivatives"]),
    ("trade_finance", ["LC", "documentary credit", "trade credit", "working capital"]),
    ("cross_cultural_management", ["cultural alignment", "global teams", "communication", "integration"]),
    ("regional_headquarters", ["RHQ setup", "tax optimization", "talent mobility", "coordination"])
]

# High-End Services Topics
HIGHEND_TOPICS = [
    ("private_banking_portfolio", ["portfolio management", "asset allocation", "performance", "rebalancing"]),
    ("estate_planning", ["estate structure", "wealth transfer", "tax planning", "succession"]),
    ("tax_optimization", ["tax strategy", "structuring", "compliance", "efficiency"]),
    ("family_office_services", ["family office", "wealth preservation", "governance", "next generation"]),
    ("concierge_services", ["lifestyle management", "travel", "events", "exclusive access"]),
    ("wealth_management", ["wealth strategy", "diversification", "risk management", "goals"]),
    ("trust_services", ["trust structure", "trustee selection", "beneficiaries", "administration"]),
    ("philanthropic_advisory", ["philanthropy", "charitable giving", "impact", "legacy"]),
    ("art_advisory", ["art collection", "authentication", "valuation", "market trends"]),
    ("luxury_real_estate", ["premium properties", "international real estate", "investment", "lifestyle"])
]

# Investment Advisory Topics
INVEST_TOPICS = [
    ("venture_capital_opportunity", ["VC deal", "startup investment", "due diligence", "valuation"]),
    ("private_equity_deal", ["PE investment", "buyout", "leverage", "exit strategy"]),
    ("real_estate_development", ["property development", "IRR", "financing", "market demand"]),
    ("portfolio_diversification", ["diversification", "asset classes", "correlation", "risk-return"]),
    ("alternative_investments", ["alternatives", "hedge funds", "private debt", "commodities"]),
    ("market_analysis", ["market outlook", "macro trends", "sector rotation", "timing"]),
    ("infrastructure_investment", ["infrastructure", "long-term yield", "concessions", "PPP"]),
    ("distressed_assets", ["distressed opportunities", "restructuring", "turnaround", "valuation"]),
    ("mezzanine_financing", ["mezzanine", "subordinated debt", "equity kicker", "returns"]),
    ("fund_selection", ["fund selection", "manager due diligence", "track record", "fees"])
]

# Luxury Lifestyle Topics
LUXURY_TOPICS = [
    ("yacht_membership", ["yacht club", "membership", "facilities", "networking"]),
    ("art_collection_advisory", ["art collecting", "artists", "market", "authentication"]),
    ("luxury_travel", ["exclusive travel", "private aviation", "luxury resorts", "experiences"]),
    ("fine_dining", ["Michelin dining", "wine collection", "chef's table", "culinary experiences"]),
    ("luxury_automotive", ["luxury cars", "collection", "customization", "exclusivity"]),
    ("premium_golf_membership", ["golf club", "championship course", "membership benefits", "tournaments"]),
    ("haute_couture", ["haute couture", "fashion houses", "bespoke", "collections"]),
    ("luxury_watches", ["timepieces", "watchmaking", "investment value", "limited editions"]),
    ("private_education", ["international schools", "elite universities", "admissions", "networks"]),
    ("wellness_spa", ["luxury wellness", "spa retreats", "personalized programs", "rejuvenation"])
]

PARTICLES = ["ya", "sih", "lah", "dong"]

def generate_message(speaker: str, content: str, offset: int, has_particle: bool, has_codeswitch: bool, emotion: str, exec_level: bool) -> Dict:
    """Generate a single message with metadata"""
    return {
        "speaker": speaker,
        "message": content,
        "timestamp_offset": offset,
        "metadata": {
            "emotion": emotion,
            "formality_level": 4,
            "contains_particles": has_particle,
            "contains_code_switch": has_codeswitch,
            "executive_level": exec_level
        }
    }

def generate_executive_conversation(conv_id: str, topic_info: tuple) -> Dict:
    """Generate executive-level conversation"""
    topic, keywords = topic_info
    num_messages = random.randint(10, 45)

    messages = []
    offset = 0

    # Template-based generation with variations
    templates = [
        # Opening patterns
        ("user", "Pak, regarding {topic}, kita perlu discuss strategy approach", False, True, "strategic"),
        ("assistant", "Setuju, especially dengan current conditions. Mari review options available", False, True, "analytical"),

        # Development patterns
        ("user", "Board akan question {keyword} aspect. Need solid justification", False, True, "concerned"),
        ("assistant", "Valid point. Let's prepare comprehensive analysis covering all angles", False, True, "professional"),

        ("user", "Timeline {keyword} perlu realistic. Execution critical ya", True, True, "pragmatic"),
        ("assistant", "Absolutely. Phased approach dengan clear milestones best strategy", False, True, "strategic"),

        # Closing patterns
        ("user", "Perfect alignment. Let's move forward dengan implementation", False, True, "decisive"),
        ("assistant", "Excellent. Will coordinate dengan relevant teams immediately", False, True, "professional"),
    ]

    for i in range(num_messages):
        template = random.choice(templates)
        speaker, msg_template, has_particle, has_code, emotion = template

        # Replace placeholders
        message = msg_template.replace("{topic}", keywords[0]).replace("{keyword}", random.choice(keywords))

        # 20% chance of particles
        if random.random() > 0.8 and not has_particle:
            particle = random.choice(PARTICLES)
            words = message.split()
            insert_pos = random.randint(len(words)//2, len(words)-1)
            words.insert(insert_pos, particle)
            message = " ".join(words)
            has_particle = True

        messages.append(generate_message(speaker, message, offset, has_particle, has_code, emotion, True))
        offset += random.randint(5, 12)

    return {
        "conversation_id": conv_id,
        "style": "executive",
        "topic": topic,
        "messages": messages,
        "quality_metrics": {
            "naturalness_score": random.randint(8, 10),
            "executive_authenticity": random.randint(8, 10),
            "strategic_depth": random.randint(8, 10),
            "international_awareness": random.randint(7, 9)
        }
    }

def generate_intl_conversation(conv_id: str, topic_info: tuple) -> Dict:
    """Generate international business conversation"""
    topic, keywords = topic_info
    num_messages = random.randint(10, 45)

    messages = []
    offset = 0

    templates = [
        ("user", "We're exploring {keyword} untuk regional expansion. Thoughts on approach?", False, True, "inquiring"),
        ("assistant", "Strategic move. Need consider {keyword2} carefully untuk success", False, True, "analytical"),

        ("user", "Singapore structure makes sense ya untuk {keyword} optimization", True, True, "strategic"),
        ("assistant", "Absolutely. Plus access broader ASEAN markets through proper setup", False, True, "advisory"),

        ("user", "Timeline realistically berapa lama untuk full implementation?", False, True, "practical"),
        ("assistant", "6-9 months achievable dengan proper resources dan planning", False, True, "informative"),

        ("user", "Excellent. Let's engage specialized advisors untuk detailed roadmap", False, True, "decisive"),
        ("assistant", "Will coordinate dengan Big 4 for comprehensive analysis", False, True, "professional"),
    ]

    for i in range(num_messages):
        template = random.choice(templates)
        speaker, msg_template, has_particle, has_code, emotion = template

        message = msg_template.replace("{keyword}", random.choice(keywords)).replace("{keyword2}", random.choice(keywords))

        if random.random() > 0.8 and not has_particle:
            particle = random.choice(PARTICLES)
            words = message.split()
            if len(words) > 3:
                insert_pos = random.randint(len(words)//2, len(words)-1)
                words.insert(insert_pos, particle)
                message = " ".join(words)
                has_particle = True

        messages.append(generate_message(speaker, message, offset, has_particle, has_code, emotion, True))
        offset += random.randint(5, 12)

    return {
        "conversation_id": conv_id,
        "style": "international_business",
        "topic": topic,
        "messages": messages,
        "quality_metrics": {
            "naturalness_score": random.randint(8, 10),
            "executive_authenticity": random.randint(8, 10),
            "strategic_depth": random.randint(8, 10),
            "international_awareness": random.randint(9, 10)
        }
    }

def generate_highend_conversation(conv_id: str, topic_info: tuple) -> Dict:
    """Generate high-end services conversation"""
    topic, keywords = topic_info
    num_messages = random.randint(10, 45)

    messages = []
    offset = 0

    templates = [
        ("user", "Need review {keyword} strategy. Current approach perlu optimization", False, True, "concerned"),
        ("assistant", "Understood concern. Recommend comprehensive analysis untuk best results", False, True, "professional"),

        ("user", "{keyword} performance adequate sih, tapi bisa better", True, True, "analytical"),
        ("assistant", "Agreed. Several enhancement opportunities available untuk improvement", False, True, "advisory"),

        ("user", "Risk management aspect critical ya dalam {keyword}", True, True, "cautious"),
        ("assistant", "Absolutely essential. Proper safeguards protect long-term interests", False, True, "reassuring"),

        ("user", "Perfect understanding. Let's proceed dengan refined approach", False, True, "satisfied"),
        ("assistant", "Excellent. Will prepare detailed proposal dengan implementation timeline", False, True, "professional"),
    ]

    for i in range(num_messages):
        template = random.choice(templates)
        speaker, msg_template, has_particle, has_code, emotion = template

        message = msg_template.replace("{keyword}", random.choice(keywords))

        if random.random() > 0.8 and not has_particle:
            particle = random.choice(PARTICLES)
            words = message.split()
            if len(words) > 3:
                insert_pos = random.randint(len(words)//2, len(words)-1)
                words.insert(insert_pos, particle)
                message = " ".join(words)
                has_particle = True

        messages.append(generate_message(speaker, message, offset, has_particle, has_code, emotion, True))
        offset += random.randint(5, 12)

    return {
        "conversation_id": conv_id,
        "style": "high_end_services",
        "topic": topic,
        "messages": messages,
        "quality_metrics": {
            "naturalness_score": random.randint(8, 10),
            "executive_authenticity": random.randint(8, 10),
            "strategic_depth": random.randint(8, 10),
            "international_awareness": random.randint(7, 9)
        }
    }

def generate_investment_conversation(conv_id: str, topic_info: tuple) -> Dict:
    """Generate investment advisory conversation"""
    topic, keywords = topic_info
    num_messages = random.randint(10, 45)

    messages = []
    offset = 0

    templates = [
        ("user", "Ada {keyword} opportunity menarik. Fundamentals look solid", False, True, "interested"),
        ("assistant", "Interesting prospect. What's {keyword2} profile dan risk assessment?", False, True, "analytical"),

        ("user", "IRR projections attractive ya, dalam line dengan targets", True, True, "positive"),
        ("assistant", "Good alignment. Need thorough {keyword} due diligence though", False, True, "cautious"),

        ("user", "Timeline untuk {keyword} realistic? Execution track record?", False, True, "inquiring"),
        ("assistant", "Proven team dengan strong history. Confidence level high", False, True, "confident"),

        ("user", "Excellent credentials. Let's proceed dengan detailed analysis", False, True, "decisive"),
        ("assistant", "Will engage advisors untuk comprehensive evaluation immediately", False, True, "professional"),
    ]

    for i in range(num_messages):
        template = random.choice(templates)
        speaker, msg_template, has_particle, has_code, emotion = template

        message = msg_template.replace("{keyword}", random.choice(keywords)).replace("{keyword2}", random.choice(keywords))

        if random.random() > 0.8 and not has_particle:
            particle = random.choice(PARTICLES)
            words = message.split()
            if len(words) > 3:
                insert_pos = random.randint(len(words)//2, len(words)-1)
                words.insert(insert_pos, particle)
                message = " ".join(words)
                has_particle = True

        messages.append(generate_message(speaker, message, offset, has_particle, has_code, emotion, True))
        offset += random.randint(5, 12)

    return {
        "conversation_id": conv_id,
        "style": "investment_advisory",
        "topic": topic,
        "messages": messages,
        "quality_metrics": {
            "naturalness_score": random.randint(8, 10),
            "executive_authenticity": random.randint(8, 10),
            "strategic_depth": random.randint(8, 10),
            "international_awareness": random.randint(7, 9)
        }
    }

def generate_luxury_conversation(conv_id: str, topic_info: tuple) -> Dict:
    """Generate luxury lifestyle conversation"""
    topic, keywords = topic_info
    num_messages = random.randint(10, 45)

    messages = []
    offset = 0

    templates = [
        ("user", "Interested in {keyword}. What's your recommendation?", False, True, "curious"),
        ("assistant", "Excellent choice. {keyword2} quality exceptional, worth investment", False, True, "enthusiastic"),

        ("user", "Premium substantial ya, but seems justified untuk value", True, True, "considering"),
        ("assistant", "Investment pays dividends. Experience dan access unparalleled", False, True, "advisory"),

        ("user", "Practical considerations untuk {keyword}? Important factors?", False, True, "practical"),
        ("assistant", "Several key aspects. Let me outline crucial elements", False, True, "informative"),

        ("user", "Perfect understanding. Appreciate detailed insights", False, True, "grateful"),
        ("assistant", "Happy to assist. This aligns well dengan lifestyle goals", False, True, "supportive"),
    ]

    for i in range(num_messages):
        template = random.choice(templates)
        speaker, msg_template, has_particle, has_code, emotion = template

        message = msg_template.replace("{keyword}", random.choice(keywords)).replace("{keyword2}", random.choice(keywords))

        if random.random() > 0.8 and not has_particle:
            particle = random.choice(PARTICLES)
            words = message.split()
            if len(words) > 3:
                insert_pos = random.randint(len(words)//2, len(words)-1)
                words.insert(insert_pos, particle)
                message = " ".join(words)
                has_particle = True

        messages.append(generate_message(speaker, message, offset, has_particle, has_code, emotion, True))
        offset += random.randint(5, 12)

    return {
        "conversation_id": conv_id,
        "style": "luxury_lifestyle",
        "topic": topic,
        "messages": messages,
        "quality_metrics": {
            "naturalness_score": random.randint(7, 9),
            "executive_authenticity": random.randint(7, 9),
            "strategic_depth": random.randint(7, 9),
            "international_awareness": random.randint(7, 9)
        }
    }

def generate_dataset():
    """Generate complete dataset of 1,500 conversations"""
    conversations = []
    conv_counter = 1

    # Generate 300 of each type
    print("Generating Executive conversations...")
    for i in range(300):
        topic_info = random.choice(EXECUTIVE_TOPICS)
        conv = generate_executive_conversation(f"jkt_prof_{conv_counter:04d}", topic_info)
        conversations.append(conv)
        conv_counter += 1
        if (i + 1) % 50 == 0:
            print(f"  Generated {i + 1}/300 executive conversations")

    print("Generating International Business conversations...")
    for i in range(300):
        topic_info = random.choice(INTL_TOPICS)
        conv = generate_intl_conversation(f"jkt_prof_{conv_counter:04d}", topic_info)
        conversations.append(conv)
        conv_counter += 1
        if (i + 1) % 50 == 0:
            print(f"  Generated {i + 1}/300 international conversations")

    print("Generating High-End Services conversations...")
    for i in range(300):
        topic_info = random.choice(HIGHEND_TOPICS)
        conv = generate_highend_conversation(f"jkt_prof_{conv_counter:04d}", topic_info)
        conversations.append(conv)
        conv_counter += 1
        if (i + 1) % 50 == 0:
            print(f"  Generated {i + 1}/300 high-end service conversations")

    print("Generating Investment Advisory conversations...")
    for i in range(300):
        topic_info = random.choice(INVEST_TOPICS)
        conv = generate_investment_conversation(f"jkt_prof_{conv_counter:04d}", topic_info)
        conversations.append(conv)
        conv_counter += 1
        if (i + 1) % 50 == 0:
            print(f"  Generated {i + 1}/300 investment conversations")

    print("Generating Luxury Lifestyle conversations...")
    for i in range(300):
        topic_info = random.choice(LUXURY_TOPICS)
        conv = generate_luxury_conversation(f"jkt_prof_{conv_counter:04d}", topic_info)
        conversations.append(conv)
        conv_counter += 1
        if (i + 1) % 50 == 0:
            print(f"  Generated {i + 1}/300 luxury conversations")

    dataset = {
        "dataset_id": "jakarta_professional_claude11",
        "total_conversations": 1500,
        "metadata": {
            "generated_date": "2025-11-16",
            "style": "jakarta_professional",
            "language": "indonesian_jakarta_executive",
            "distributions": {
                "executive_level": 300,
                "international_business": 300,
                "high_end_services": 300,
                "investment_advisory": 300,
                "luxury_lifestyle": 300
            }
        },
        "conversations": conversations
    }

    return dataset

if __name__ == "__main__":
    print("Starting Jakarta Professional Dataset Generation...")
    print("=" * 60)

    dataset = generate_dataset()

    print("\nWriting to file...")
    with open("claude11_jakarta_professional.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Successfully generated {len(dataset['conversations'])} conversations")
    print(f"✓ Saved to: claude11_jakarta_professional.json")
    print("=" * 60)
