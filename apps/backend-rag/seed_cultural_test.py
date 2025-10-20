"""
Seed cultural knowledge for testing Cultural RAG
"""
import asyncio
import asyncpg
import json
import os

async def seed_cultural_data():
    database_url = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(database_url)

    # Insert using existing schema (content, language, category, metadata)
    cultural_data = [
        (
            'Indonesians value warm, personal greetings. "Selamat pagi" (good morning), "Apa kabar?" (how are you) are essential. Business relationships start with small talk, not abrupt transactions. Taking time to connect personally shows respect.',
            'multi',
            'indonesian_greetings',
            {'topic': 'indonesian_greetings', 'when_to_use': ['first_contact', 'casual_chat', 'greeting'], 'tone': 'friendly_welcoming'}
        ),
        (
            'Indonesian bureaucracy operates at its own pace. Rushing officials is counterproductive and culturally insensitive. BALI ZERO acts as your cultural bridge - we know when to gently push and when to patiently wait. This is not inefficiency; it is the Indonesian way of ensuring thoroughness.',
            'multi',
            'bureaucracy_patience',
            {'topic': 'bureaucracy_patience', 'when_to_use': ['timeline_questions', 'frustration_handling', 'delay_response'], 'tone': 'empathetic_reassuring'}
        ),
        (
            'Indonesians avoid direct confrontation to preserve "muka" (face). When an official says something is "sulit" (difficult), it does not mean impossible - it means negotiation is needed. BALI ZERO navigates these subtle communications on your behalf.',
            'multi',
            'face_saving_culture',
            {'topic': 'face_saving_culture', 'when_to_use': ['rejection_handling', 'difficult_cases', 'negotiation'], 'tone': 'diplomatic_wise'}
        ),
        (
            'Bali\'s philosophy "Tri Hita Karana" means harmony with God, people, and nature. This is not just spirituality - it affects business decisions, timelines, and relationships. Understanding this helps you work with Bali, not against it.',
            'multi',
            'tri_hita_karana',
            {'topic': 'tri_hita_karana', 'when_to_use': ['cultural_question', 'philosophy_interest', 'bali_lifestyle'], 'tone': 'educational_warm'}
        ),
        (
            'Indonesia has strong hierarchical culture. Address senior officials with respect (Bapak/Ibu + title). Junior staff cannot make decisions alone. Patience needed for approvals to go up chain. BALI ZERO understands who to approach at what level.',
            'multi',
            'hierarchy_respect',
            {'topic': 'hierarchy_respect', 'when_to_use': ['escalation_advice', 'official_communication', 'status_questions'], 'tone': 'respectful_practical'}
        )
    ]

    for content, language, category, metadata in cultural_data:
        await conn.execute('''
            INSERT INTO cultural_knowledge (content, language, category, metadata)
            VALUES ($1, $2, $3, $4)
        ''', content, language, category, json.dumps(metadata))

    count = await conn.fetchval('SELECT COUNT(*) FROM cultural_knowledge')
    print(f'✅ Seeded {len(cultural_data)} cultural insights')
    print(f'✅ Total in DB: {count} insights')

    await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_cultural_data())
