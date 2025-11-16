"""
Jakarta Special Conversations Dataset Generator - Claude 5

Generates 1,500 ultra-realistic Indonesian conversations for Jakarta special contexts:
- Legal consultations
- Medical discussions
- Educational queries
- Government services
- Emergency situations

Features more formal but warm Jakarta Indonesian with strategic particle usage.
"""

import asyncio
import json
import logging
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import httpx

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class JakartaSpecialGenerator:
    """Generates Jakarta Special conversation dataset"""

    # Core prompt template for Jakarta Special contexts
    PROMPT_TEMPLATE = """You are an expert at generating ultra-realistic Indonesian conversations in Jakarta special contexts.

Generate a completely natural conversation that sounds EXACTLY like real interactions in {category} settings in Jakarta, Indonesia in 2025.

# CRITICAL REQUIREMENTS

## 1. JAKARTA SPECIAL STYLE
This is MORE FORMAL than casual chat but retains Jakarta warmth:

### Formality Level: {formality_desc}
- Use proper Indonesian but with Jakarta characteristics
- Mix of "saya/anda" (formal) and "gue/lu" (informal) based on rapport
- Professional vocabulary with natural explanations
- Strategic particle usage (25% of messages) for warmth and softening

### Particles (Use strategically in ~25% of messages):
- **ya** (softener/agreement): "Begitu ya", "Iya ya memang gitu"
- **sih** (question/softener): "Gimana sih prosesnya?", "Apa sih yang harus dilakukan?"
- **kok** (concern/surprise): "Kok lama ya?", "Kenapa kok begitu?"
- **kan** (seeking confirmation): "Sudah jelas kan?", "Bisa kan?"

### Technical Terms Mixed with Explanations:
- Use proper terminology but explain in accessible Indonesian
- "SKCK itu Surat Keterangan Catatan Kepolisian"
- "Rujukan maksudnya surat pengantar dari dokter umum"
- "SKS atau Satuan Kredit Semester itu..."

## 2. CATEGORY: {category}

{category_context}

## 3. CONVERSATION STRUCTURE

Length: {length} messages (range: 10-40 messages)

Natural progression:
1. **Opening (2-4 messages)**: Greeting, initial question/concern
2. **Information gathering (3-8 messages)**: Understanding the situation, asking clarifying questions
3. **Main discussion ({main_discussion_messages} messages)**: Detailed information, explanations, guidance
4. **Clarifications (3-6 messages)**: Follow-up questions, addressing concerns
5. **Conclusion (2-4 messages)**: Summary, next steps, closing

CRITICAL: Show natural conversation flow with:
- Information-seeking questions
- Clarification requests
- Confirmations of understanding
- Natural topic evolution
- Memory references to earlier messages

## 4. METADATA REQUIREMENTS

Each message MUST have:
- speaker: "user" or "assistant"
- message: the actual message text
- timestamp_offset: seconds from conversation start
- metadata:
  - emotion: {emotion_options}
  - formality_level: 1-5 (1=very casual, 5=very formal)
  - contains_particles: true/false
  - contains_slang: true/false

## 5. AUTHENTICITY MARKERS

✅ DO:
- Use natural Jakarta Indonesian patterns
- Mix formal and informal appropriately
- Include specific details relevant to category
- Show empathy and professionalism
- Use particles strategically for warmth
- Include realistic concerns and questions

❌ DON'T:
- Be overly stiff or robotic
- Use excessive particles (only ~25% of messages)
- Mix English unnecessarily
- Give unrealistic or incorrect information
- Rush through topics unnaturally

## 6. QUALITY METRICS

You will be assessed on:
- naturalness_score (1-10): How natural and realistic
- particle_density (0.0-1.0): Particle usage rate (target: ~0.25)
- professional_clarity (1-10): How clear and professional
- information_depth (1-10): Quality and depth of information

# OUTPUT FORMAT

Return ONLY valid JSON (no markdown wrapper, no explanations):

{{
  "conversation_id": "jkt_special_{unique_number:03d}",
  "style": "{category}",
  "topic": "{specific_topic}",
  "messages": [
    {{
      "speaker": "user",
      "message": "Selamat pagi, saya mau konsultasi tentang...",
      "timestamp_offset": 0,
      "metadata": {{
        "emotion": "polite",
        "formality_level": 3,
        "contains_particles": false,
        "contains_slang": false
      }}
    }},
    {{
      "speaker": "assistant",
      "message": "Selamat pagi. Tentu, saya siap membantu. Bisa ceritakan situasinya seperti apa ya?",
      "timestamp_offset": 5,
      "metadata": {{
        "emotion": "professional",
        "formality_level": 3,
        "contains_particles": true,
        "contains_slang": false
      }}
    }}
  ],
  "quality_metrics": {{
    "naturalness_score": 8,
    "particle_density": 0.25,
    "professional_clarity": 9,
    "information_depth": 8
  }}
}}

# SPECIFIC TOPIC FOR THIS CONVERSATION: {specific_topic}

Now generate the conversation following ALL requirements above. Make it completely unique and realistic.
"""

    # Category contexts and topics
    CATEGORIES = {
        "legal_consultation": {
            "formality_desc": "Professional but approachable - like talking to a helpful lawyer",
            "emotion_options": "worried, concerned, relieved, hopeful, confident, uncertain, satisfied",
            "topics": [
                "property_dispute", "inheritance_issues", "divorce_proceedings", "employment_contract",
                "business_partnership_conflict", "debt_collection", "land_certificate_problems",
                "tenant_landlord_dispute", "consumer_protection", "online_fraud_case",
                "intellectual_property", "defamation_case", "contract_breach", "family_law",
                "criminal_complaint", "civil_lawsuit", "notary_services", "legal_documents",
                "arbitration_mediation", "company_registration", "trademark_registration",
                "will_testament", "power_of_attorney", "prenuptial_agreement", "adoption_process",
                "custody_rights", "property_transfer", "license_permit", "legal_compliance",
                "tax_dispute"
            ],
            "context": """
**Legal Consultation Context**

Setting: Legal consultation office or phone consultation in Jakarta

Common scenarios:
- Property disputes (sengketa tanah, sertifikat)
- Family law (divorce, inheritance, custody)
- Business legal issues (contracts, partnerships, disputes)
- Employment law (wrongful termination, contracts)
- Criminal cases (complaints, reports)
- Consumer protection and fraud cases

Key vocabulary:
- Sertifikat (land certificate)
- Gugatan (lawsuit)
- Mediasi (mediation)
- Kuasa hukum (legal counsel)
- Akta (deed/legal document)
- Notaris (notary)
- SKCK (police clearance letter)
- Somasi (formal warning letter)
- Bukti (evidence)
- Saksi (witness)

Emotional progression: Worried/Stressed → Understanding → Relief/Clarity
Professional tone: Empathetic, clear explanations, actionable guidance
"""
        },
        "medical_discussion": {
            "formality_desc": "Doctor-patient professional warmth with medical clarity",
            "emotion_options": "worried, concerned, anxious, relieved, hopeful, scared, grateful, cautious",
            "topics": [
                "chronic_disease_management", "diabetes_consultation", "hypertension_treatment",
                "pregnancy_checkup", "child_vaccination", "skin_condition", "digestive_issues",
                "respiratory_problems", "heart_disease_concerns", "mental_health_counseling",
                "nutritional_advice", "post_surgery_recovery", "medication_consultation",
                "allergies_treatment", "laboratory_results", "specialist_referral",
                "preventive_health_screening", "elderly_care", "chronic_pain_management",
                "sleep_disorders", "weight_management", "exercise_recommendations",
                "dental_health", "eye_problems", "BPJS_healthcare", "health_insurance",
                "second_opinion_request", "lifestyle_disease", "tropical_disease",
                "travel_health_advice"
            ],
            "context": """
**Medical Discussion Context**

Setting: Hospital, clinic, or telemedicine consultation in Jakarta

Common scenarios:
- Chronic disease management (diabetes, hypertension)
- Acute symptoms consultation
- Medication questions and side effects
- Test results explanation
- Specialist referrals (rujukan)
- BPJS and insurance coverage
- Preventive health advice
- Mental health consultations

Key vocabulary:
- Rujukan (referral letter)
- BPJS (national healthcare)
- Resep (prescription)
- Hasil lab (lab results)
- Gejala (symptoms)
- Diagnosis (diagnosis)
- Terapi/pengobatan (treatment)
- Efek samping (side effects)
- Rawat jalan (outpatient)
- Rawat inap (inpatient)
- Dokter spesialis (specialist)

Emotional progression: Anxious → Understood → Reassured/Hopeful
Professional tone: Empathetic, clear medical explanations, patient safety focus
"""
        },
        "educational_queries": {
            "formality_desc": "Academic advisor warmth with educational professionalism",
            "emotion_options": "curious, confused, motivated, frustrated, hopeful, determined, satisfied, uncertain",
            "topics": [
                "university_admission", "scholarship_application", "course_selection", "major_selection",
                "transfer_credits", "thesis_guidance", "academic_performance", "graduation_requirements",
                "study_abroad_programs", "internship_opportunities", "research_opportunities",
                "academic_probation", "class_schedule", "tuition_payment", "student_loan",
                "academic_counseling", "career_planning", "exchange_program", "dual_degree",
                "online_courses", "certificate_programs", "skills_development", "extracurricular",
                "student_organization", "academic_competition", "publication_guidance",
                "lecturer_consultation", "exam_preparation", "learning_difficulties", "special_needs_education"
            ],
            "context": """
**Educational Queries Context**

Setting: University academic office, counseling session, or student services in Jakarta

Common scenarios:
- University admission and requirements
- Scholarship and financial aid
- Academic performance and guidance
- Course selection and major changes
- Thesis/research supervision
- Graduation requirements (wisuda)
- Exchange programs and study abroad
- Career planning and internships

Key vocabulary:
- SKS (credit hours - Satuan Kredit Semester)
- IPK/GPA (grade point average)
- KRS (course registration card)
- Wisuda (graduation ceremony)
- Beasiswa (scholarship)
- Dosen pembimbing (academic advisor)
- Skripsi/tesis (thesis)
- Transkrip nilai (transcript)
- Cuti akademik (academic leave)
- Praktek kerja lapangan/PKL (internship)

Emotional progression: Uncertain → Informed → Confident/Motivated
Professional tone: Supportive, informative, encouraging
"""
        },
        "government_services": {
            "formality_desc": "Government office professional with helpful public service approach",
            "emotion_options": "confused, frustrated, hopeful, relieved, patient, impatient, satisfied, concerned",
            "topics": [
                "ktp_renewal", "kk_update", "birth_certificate", "marriage_certificate",
                "divorce_certificate", "death_certificate", "domicile_letter", "business_permit",
                "building_permit", "tax_payment", "vehicle_registration", "drivers_license",
                "passport_application", "visa_extension", "land_certificate", "property_tax",
                "social_assistance", "pension_claim", "health_card", "subsidized_housing",
                "business_license_nib", "environmental_permit", "trading_permit", "halal_certificate",
                "complaint_submission", "public_information_request", "school_registration",
                "vaccination_certificate", "police_clearance", "court_services"
            ],
            "context": """
**Government Services Context**

Setting: Government offices (Kelurahan, Dukcapil, Dispenda, etc.) in Jakarta

Common scenarios:
- Civil documents (KTP, KK, birth certificates)
- Business permits and licenses (NIB, SIUP)
- Tax services (PBB, PKB, pajak)
- Immigration services (passport, visa)
- Land and property services (sertifikat, IMB)
- Social assistance programs
- Public complaints and information requests

Key vocabulary:
- KTP (national ID card)
- KK (family card - Kartu Keluarga)
- Akta kelahiran (birth certificate)
- Surat domisili (domicile letter)
- NIB (business identification number)
- IMB (building permit)
- PBB (property tax)
- Dukcapil (civil registry office)
- Persyaratan (requirements)
- Berkas (documents/files)
- Legalisir (document legalization)

Emotional progression: Confused/Frustrated → Guided → Relieved/Satisfied
Professional tone: Patient, step-by-step guidance, bureaucratic clarity
"""
        },
        "emergency_situations": {
            "formality_desc": "Urgent but calm - emergency responder professionalism",
            "emotion_options": "panicked, urgent, scared, anxious, desperate, relieved, grateful, calm",
            "topics": [
                "medical_emergency_ambulance", "fire_emergency", "police_emergency", "accident_report",
                "domestic_violence_report", "theft_robbery_report", "natural_disaster_response",
                "flood_emergency", "earthquake_response", "child_emergency", "elderly_emergency",
                "poisoning_emergency", "heart_attack_stroke", "severe_injury", "mental_health_crisis",
                "suicide_prevention", "missing_person_report", "traffic_accident", "building_collapse",
                "gas_leak", "electrical_emergency", "animal_attack", "drowning_emergency",
                "burn_emergency", "allergic_reaction", "pregnancy_emergency", "violence_threat",
                "property_damage_emergency", "public_safety_threat", "chemical_spill"
            ],
            "context": """
**Emergency Situations Context**

Setting: Emergency call center (119, 110, 112, 113) or crisis response in Jakarta

Common scenarios:
- Medical emergencies (ambulance needed)
- Fire emergencies
- Police emergencies (crime, violence)
- Natural disasters (flood, earthquake)
- Accidents (traffic, workplace)
- Crisis situations (suicide risk, violence)
- Missing persons
- Public safety threats

Key vocabulary:
- Ambulans (ambulance)
- Damkar (fire department)
- Polisi (police)
- Rumah sakit terdekat (nearest hospital)
- Alamat lengkap (complete address)
- Korban (victim/casualty)
- Luka (injury/wound)
- Pertolongan pertama (first aid)
- Evakuasi (evacuation)
- Tim SAR (search and rescue)
- Situasi darurat (emergency situation)

Emotional progression: Panicked/Urgent → Guided/Calmed → Reassured/Acting
Professional tone: Calm, directive, life-saving priority, quick assessment
"""
        }
    }

    def __init__(self, anthropic_api_key: str, model: str = "claude-sonnet-4-5-20250929"):
        """Initialize generator with API key"""
        self.api_key = anthropic_api_key
        self.model = model
        self.api_url = "https://api.anthropic.com/v1/messages"

    async def generate_conversation(
        self,
        category: str,
        conversation_number: int,
        specific_topic: str
    ) -> Optional[Dict]:
        """Generate single conversation"""

        category_config = self.CATEGORIES[category]

        # Determine conversation length (10-40 messages)
        length = random.randint(10, 40)
        main_discussion_messages = max(4, length - 14)

        # Build prompt
        prompt = self.PROMPT_TEMPLATE.format(
            category=category,
            formality_desc=category_config["formality_desc"],
            emotion_options=category_config["emotion_options"],
            category_context=category_config["context"],
            length=length,
            main_discussion_messages=main_discussion_messages,
            specific_topic=specific_topic,
            unique_number=conversation_number
        )

        logger.info(f"🔄 Generating {category} conversation #{conversation_number}: {specific_topic}")

        try:
            # Call Claude API
            result = await self._call_claude_api(prompt)

            if not result:
                logger.error(f"❌ Failed to generate conversation #{conversation_number}")
                return None

            # Parse response
            conversation_data = self._parse_response(result, category, conversation_number)

            if conversation_data:
                msg_count = len(conversation_data.get("messages", []))
                quality = conversation_data.get("quality_metrics", {})
                logger.info(f"✅ Generated {msg_count} messages | Quality: {quality.get('naturalness_score', 0)}/10")

            return conversation_data

        except Exception as e:
            logger.error(f"❌ Error generating conversation: {e}")
            return None

    async def _call_claude_api(self, prompt: str) -> Optional[str]:
        """Call Claude API"""
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 8000,
                        "temperature": 0.9,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                response.raise_for_status()
                data = response.json()

                content = data.get("content", [])
                if content and len(content) > 0:
                    return content[0].get("text", "")

                return None

        except Exception as e:
            logger.error(f"❌ API call failed: {e}")
            return None

    def _parse_response(self, response: str, category: str, conv_num: int) -> Optional[Dict]:
        """Parse Claude's JSON response"""
        try:
            # Clean response
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            # Parse JSON
            data = json.loads(cleaned)

            # Validate required fields
            if "messages" not in data:
                logger.error("❌ Missing 'messages' field")
                return None

            if "quality_metrics" not in data:
                data["quality_metrics"] = {
                    "naturalness_score": 0,
                    "particle_density": 0.0,
                    "professional_clarity": 0,
                    "information_depth": 0
                }

            # Ensure conversation_id matches expected format
            data["conversation_id"] = f"jkt_special_{conv_num:03d}"
            data["style"] = category

            return data

        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            logger.error(f"Response preview: {response[:300]}...")
            return None
        except Exception as e:
            logger.error(f"❌ Parse error: {e}")
            return None


async def generate_full_dataset(api_key: str, output_file: str = "claude5_jakarta_special.json"):
    """Generate complete dataset of 1,500 conversations"""

    generator = JakartaSpecialGenerator(api_key)

    # Distribution: 300 conversations per category
    categories = [
        "legal_consultation",
        "medical_discussion",
        "educational_queries",
        "government_services",
        "emergency_situations"
    ]

    all_conversations = []
    conversation_counter = 1

    logger.info("=" * 80)
    logger.info("🚀 JAKARTA SPECIAL DATASET GENERATION - 1,500 CONVERSATIONS")
    logger.info("=" * 80)

    for category in categories:
        logger.info(f"\n📂 CATEGORY: {category.upper().replace('_', ' ')}")
        logger.info(f"   Target: 300 conversations")
        logger.info("-" * 80)

        category_config = generator.CATEGORIES[category]
        topics = category_config["topics"]

        # Generate 300 conversations for this category in batches of 10 (parallel)
        batch_size = 10
        for batch_start in range(0, 300, batch_size):
            batch_end = min(batch_start + batch_size, 300)
            tasks = []

            for i in range(batch_start, batch_end):
                topic = topics[i % len(topics)]
                conv_num = conversation_counter + i - batch_start
                tasks.append(generator.generate_conversation(
                    category=category,
                    conversation_number=conv_num,
                    specific_topic=topic
                ))

            # Run batch in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            for i, result in enumerate(results):
                conv_num = conversation_counter + i
                if isinstance(result, Exception):
                    logger.error(f"❌ Exception in conversation #{conv_num}: {result}")
                elif result:
                    all_conversations.append(result)
                else:
                    logger.warning(f"⚠️  Failed conversation #{conv_num}")

            conversation_counter += batch_size

            # Progress update
            logger.info(f"   Progress: {batch_end}/300 conversations ({len(all_conversations)}/{conversation_counter-1} successful)")

        logger.info(f"✅ Completed {category}: {len([c for c in all_conversations if c.get('style') == category])} conversations")

    # Build final dataset
    dataset = {
        "dataset_id": "jakarta_special_claude5",
        "total_conversations": len(all_conversations),
        "generated_at": datetime.now().isoformat(),
        "categories": {
            "legal_consultation": len([c for c in all_conversations if c.get('style') == 'legal_consultation']),
            "medical_discussion": len([c for c in all_conversations if c.get('style') == 'medical_discussion']),
            "educational_queries": len([c for c in all_conversations if c.get('style') == 'educational_queries']),
            "government_services": len([c for c in all_conversations if c.get('style') == 'government_services']),
            "emergency_situations": len([c for c in all_conversations if c.get('style') == 'emergency_situations'])
        },
        "conversations": all_conversations
    }

    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    logger.info("\n" + "=" * 80)
    logger.info(f"✅ DATASET GENERATION COMPLETE!")
    logger.info(f"   Total conversations: {len(all_conversations)}")
    logger.info(f"   Output file: {output_file}")
    logger.info(f"   File size: {os.path.getsize(output_file) / 1024 / 1024:.2f} MB")
    logger.info("=" * 80)

    # Quality summary
    avg_naturalness = sum(c.get('quality_metrics', {}).get('naturalness_score', 0) for c in all_conversations) / len(all_conversations)
    avg_clarity = sum(c.get('quality_metrics', {}).get('professional_clarity', 0) for c in all_conversations) / len(all_conversations)
    avg_depth = sum(c.get('quality_metrics', {}).get('information_depth', 0) for c in all_conversations) / len(all_conversations)

    logger.info(f"\n📊 QUALITY METRICS (Average):")
    logger.info(f"   Naturalness: {avg_naturalness:.2f}/10")
    logger.info(f"   Professional Clarity: {avg_clarity:.2f}/10")
    logger.info(f"   Information Depth: {avg_depth:.2f}/10")

    return dataset


if __name__ == "__main__":
    # Get API key from environment
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        logger.error("❌ ANTHROPIC_API_KEY environment variable not set")
        exit(1)

    # Run generation
    asyncio.run(generate_full_dataset(api_key))
