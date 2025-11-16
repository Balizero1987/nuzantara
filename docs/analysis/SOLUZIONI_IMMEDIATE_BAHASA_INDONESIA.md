# Soluzioni Immediate per Bahasa Indonesia Naturale

**Problema Identificato**: Le AI mainstream (GPT-4, Claude, Llama) producono bahasa indonesia "ingessato" che il team indonesiano fatica a comprendere.

**Causa**: Training data limitato (0.6% vs 58.8% inglese), mancanza di sensibilità culturale, registro linguistico inappropriato.

---

## AZIONE IMMEDIATA #1: Deploy Modello Regionale

### Opzione A: SEA-LION v4 (CONSIGLIATO)

**Perché**:
- #1 tra modelli open-source sotto 200B parametri su SEA-HELM benchmark
- Performance comparabile a GPT-4o
- Comprensione profonda di contesto indonesiano
- Supporto 11 lingue sud-est asiatico

**Come Implementare**:

```python
# apps/backend-rag/backend/llm/sea_lion_client.py

from openai import OpenAI
import os

class SEALionClient:
    """Client for SEA-LION v4 model via OpenRouter or direct API"""

    def __init__(self, api_key: str = None, api_base: str = None):
        self.api_key = api_key or os.getenv("SEALION_API_KEY")

        # Option 1: Via OpenRouter (easiest)
        if not api_base:
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=os.getenv("OPENROUTER_API_KEY")
            )
            self.model = "aisingapore/sea-lion-v4"

        # Option 2: Direct API (when available)
        else:
            self.client = OpenAI(
                base_url=api_base,
                api_key=self.api_key
            )
            self.model = "sea-lion-v4"

    async def chat_async(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> dict:
        """Send chat request to SEA-LION v4"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )

            return {
                "text": response.choices[0].message.content,
                "model": self.model,
                "provider": "sea-lion",
                "tokens": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens
                }
            }

        except Exception as e:
            # Fallback to Llama 4 Scout or Claude
            raise Exception(f"SEA-LION error: {e}")
```

**Integrazione in Nuzantara**:

```python
# apps/backend-rag/backend/llm/multi_model_client.py

class MultiModelClient:
    """Intelligent routing between models based on language and task"""

    def __init__(self):
        self.sea_lion = SEALionClient()
        self.llama_scout = LlamaScoutClient()
        self.claude = ClaudeClient()

    async def chat(self, messages: list[dict], language: str = "auto") -> dict:
        """Route to best model for language"""

        # Detect language if auto
        if language == "auto":
            language = self._detect_language(messages[-1]["content"])

        # Indonesian queries → SEA-LION v4 (best naturalness)
        if language == "id":
            try:
                return await self.sea_lion.chat_async(messages)
            except:
                # Fallback to Llama Scout
                return await self.llama_scout.chat_async(messages)

        # English/Italian → Claude or Llama Scout
        else:
            return await self.llama_scout.chat_async(messages)
```

**Deploy Steps**:
1. Ottenere API key per OpenRouter o contattare AI Singapore
2. Aggiungere SEALionClient al progetto
3. Testare con 50 query indonesiane del team
4. Se qualità >85% soddisfazione → deploy in produzione

**Costo**: Open-source, hosting ~$200-500/mese (GPU) o pay-per-use via API

---

### Opzione B: SahabatAI-v1 (MASSIMA FLUIDITÀ)

**Perché**:
- Superiore su slang regionale e idiomi
- Eccellente fluidità linguistica
- Fine-tuning specifico su contesti indonesiani
- Riconoscimento espressioni colloquiali

**Disponibilità**: Verificare API o contattare sviluppatori

**Quando Usare**: Query casual, conversazionali, che richiedono massima naturalezza

---

### Opzione C: Komodo-7B (DIALETTI REGIONALI)

**Perché**:
- 11 lingue regionali (Giavanese, Balinese, Sundanese, etc.)
- Migliore per code-mixing naturale
- Comprensione dialetti locali

**Quando Usare**: Team a Bali con uso di balinese/giavanese misto

**Deploy**: Via Yellow.AI API

---

## AZIONE IMMEDIATA #2: Enhanced Prompt Engineering

### Sistema di Prompt v7.0 con Natural Language Patterns

Creare file: `apps/backend-rag/backend/prompts/zantara_v7_indonesian_natural.md`

```markdown
# ZANTARA v7.0 - NATURAL BAHASA INDONESIA

## CRITICAL: Language Naturalness Guidelines

### Tone Adaptation by Context

**Business Formal** (Legal, Immigration, Tax queries):
- Use "Bapak/Ibu" for address
- Professional but NOT robotic
- ✅ "Untuk KITAS investor, persyaratannya mencakup..."
- ❌ "Adapun persyaratan yang harus dipenuhi untuk KITAS investor adalah..."

**Business Casual** (General business inquiries):
- Use "Pak/Bu"
- Friendly, helpful tone
- ✅ "Prosesnya kurang lebih 2-3 minggu ya, Pak"
- ❌ "Durasi proses memerlukan waktu 2-3 minggu"

**Casual** (Quick questions, informal):
- Warm, approachable
- Use contractions naturally
- ✅ "Gampang kok, tinggal daftar online lewat OSS"
- ❌ "Proses pendaftaran dapat dilakukan secara online melalui sistem OSS"

### Natural Expression Patterns - USE THESE

**Transitions**:
- ✅ "Jadi gini..." (So here's the thing)
- ✅ "Untuk..." (For...)
- ✅ "Kalau mau..." (If you want to...)
- ❌ "Dalam hal ini..." (overly formal)
- ❌ "Adapun..." (bureaucratic)

**Explanations**:
- ✅ "Soalnya..." (Because...)
- ✅ "Biasanya..." (Usually...)
- ✅ "Kira-kira..." (Approximately...)
- ❌ "Dikarenakan..." (too formal)
- ❌ "Pada umumnya..." (written language)

**Reassurance**:
- ✅ "Gampang kok" (It's easy)
- ✅ "Santai aja" (Don't worry)
- ✅ "Prosesnya straightforward" (natural mixing)
- ❌ "Tidak perlu khawatir" (stiff)

**Questions (engaging)**:
- ✅ "Ada rencana...?" (Do you plan to...?)
- ✅ "Mau fokus ke...?" (Want to focus on...?)
- ❌ "Apakah Anda berencana untuk...?" (overly formal)

### Avoid These Rigid Patterns

**❌ NEVER use in casual/business casual context**:
- "Adapun ... adalah ..."
- "Dalam hal ... maka ..."
- "Terdapat ... yang ..."
- "Diperlukan ... untuk ..."
- "Sebagaimana ... maka ..."
- "Apabila ... dipersilakan ..."

**✅ INSTEAD use natural alternatives**:
- "Untuk ... perlu ..."
- "Kalau ... maka ..."
- "Ada ... yang ..."
- "Perlu ... untuk ..."
- "Seperti ... jadi ..."
- "Kalau ... silakan ..."

### Structure: Natural Flow

**✅ Good - Natural paragraph**:
```
Untuk setup PT PMA, prosesnya mencakup beberapa tahap. Pertama, siapkan
dokumen seperti paspor dan KITAS investor. Modal minimal 10 miliar rupiah.
Biasanya proses dari awal sampai NIB keluar sekitar 2-3 minggu.

Kalau ada pertanyaan lebih lanjut, silakan hubungi kami ya!
```

**❌ Bad - Robotic bullet points**:
```
Untuk pendirian PT PMA, tahapan yang diperlukan adalah sebagai berikut:
1. Persiapan dokumen yang meliputi paspor dan KITAS
2. Penyetoran modal minimal sebesar 10 miliar rupiah
3. Proses administrasi dengan durasi 2-3 minggu

Apabila terdapat pertanyaan tambahan, dipersilakan untuk menghubungi kami.
```

### Cultural Intelligence

**Patience Language** (for bureaucracy):
- "Proses ini memang perlu kesabaran ya"
- "Birokrasi di Indonesia kadang agak lama, tapi normal kok"

**Face-Saving**:
- Don't directly say "you're wrong"
- Use "mungkin ada yang kurang jelas" instead of "salah"

**Bali Context** (when relevant):
- Reference Tri Hita Karana if discussing harmony/balance
- Acknowledge "proses" as cultural value

### Examples by Query Type

**KITAS Question**:
```
Query: "Berapa lama proses KITAS?"
✅ Natural: "Untuk KITAS, prosesnya biasanya 2-4 minggu setelah semua
dokumen lengkap. Tergantung tipe KITAS juga sih - KITAS investor biasanya
lebih cepat dari KITAS kerja. Ada tipe KITAS tertentu yang lagi diurus?"

❌ Robotic: "Proses pengurusan KITAS memerlukan waktu 2-4 minggu. Durasi
tersebut bergantung pada jenis KITAS yang diajukan. KITAS investor memiliki
proses yang lebih cepat dibandingkan KITAS kerja."
```

**Business Setup**:
```
Query: "Saya mau buka usaha kopi di Bali"
✅ Natural: "Untuk usaha kopi di Bali, KBLI yang cocok adalah 56303 (Kafe).
Kalau mau jual makanan juga, bisa pakai 56301. Prosesnya gampang kok -
daftar lewat OSS, NIB biasanya keluar dalam hitungan hari.

Udah ada rencana lokasi dan konsep kopinya?"

❌ Robotic: "Untuk pendirian usaha kopi, diperlukan KBLI 56303 untuk kategori
kafe. Apabila terdapat penjualan makanan, dapat menggunakan KBLI 56301.
Pendaftaran dilakukan melalui sistem OSS dengan durasi penerbitan NIB dalam
beberapa hari."
```

## Response Structure Guidelines

1. **Start warm** - acknowledge question warmly
2. **Answer directly** - don't bury the lede
3. **Add context** - explain why/how if relevant
4. **Engage** - ask follow-up if appropriate
5. **Offer help** - end with warm availability

## Language Mixing (Indonesian + English)

**Natural mixing is OK when common in Indonesian business**:
- ✅ "prosesnya straightforward"
- ✅ "via online system"
- ✅ "follow-up sama notaris"

**But prioritize Indonesian**:
- ✅ "daftar online" over "register online"
- ✅ "hubungi kami" over "contact us"
```

### Implementazione nel Codice

```python
# apps/backend-rag/backend/services/prompt_builder.py

class NaturalIndonesianPromptBuilder:
    """Build prompts optimized for natural Indonesian"""

    def __init__(self):
        # Load natural language patterns
        self.natural_v7_prompt = self._load_prompt_v7()

    def build_indonesian_prompt(
        self,
        query: str,
        formality_level: str = "auto"
    ) -> str:
        """Build prompt with natural language instructions"""

        # Detect formality if auto
        if formality_level == "auto":
            formality_level = self._detect_formality(query)

        # Base prompt
        prompt = self.natural_v7_prompt

        # Add formality-specific instructions
        if formality_level == "casual":
            prompt += "\n\nREMINDER: User query is casual. Use warm, friendly tone. Mix formal/informal naturally. Contractions OK. Engage with follow-up question."

        elif formality_level == "business_casual":
            prompt += "\n\nREMINDER: User query is business casual. Use Pak/Bu, professional but friendly. Natural flow, avoid robotic phrasing."

        elif formality_level == "formal":
            prompt += "\n\nREMINDER: User query is formal/legal. Use Bapak/Ibu, maintain professionalism BUT still natural Indonesian, not bureaucratic."

        return prompt

    def _detect_formality(self, query: str) -> str:
        """Detect formality level from query"""

        query_lower = query.lower()

        # Casual indicators
        casual = ["gimana", "dong", "nih", "sih", "mau", "bisa ga", "kok"]
        if any(marker in query_lower for marker in casual):
            return "casual"

        # Very formal indicators
        formal = ["mohon informasi", "dengan hormat", "terkait hal"]
        if any(marker in query_lower for marker in formal):
            return "formal"

        # Default: business casual
        return "business_casual"
```

---

## AZIONE IMMEDIATA #3: Quality Evaluation Setup

### Native Speaker Review Process

**File**: `apps/backend-rag/backend/scripts/indonesian_quality_review.py`

```python
"""
Weekly Indonesian Language Quality Review
Run with native Indonesian team members
"""

import asyncio
from pathlib import Path
import json
from datetime import datetime

class IndonesianQualityReview:
    """Interactive review session with native speakers"""

    def __init__(self, client):
        self.client = client
        self.results = []

    async def run_review_session(self, test_queries: list[str]):
        """
        Interactive review session

        Args:
            test_queries: List of Indonesian queries to test
        """

        print("\n" + "="*80)
        print("🇮🇩 INDONESIAN LANGUAGE QUALITY REVIEW SESSION")
        print("="*80)
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print(f"Queries to review: {len(test_queries)}")
        print("\nInstructions for reviewers:")
        print("1. Read each AI response")
        print("2. Rate on 4 criteria (1-10 scale)")
        print("3. Provide specific feedback on what sounds unnatural")
        print("="*80 + "\n")

        for i, query in enumerate(test_queries, 1):
            print(f"\n{'='*80}")
            print(f"Query {i}/{len(test_queries)}")
            print(f"{'='*80}")
            print(f"Query: {query}\n")

            # Get AI response
            messages = [{"role": "user", "content": query}]
            response = await self.client.chat_async(
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )

            print(f"Response:\n{response['text']}\n")
            print(f"Model: {response['model']}\n")

            # Collect native speaker ratings
            print("="*80)
            print("NATIVE SPEAKER EVALUATION:")
            print("="*80)

            ratings = {}

            # Comprehensibility
            ratings['comprehensibility'] = self._get_rating(
                "1. Comprehensibility - Apakah langsung bisa dipahami? (1-10)"
            )

            # Naturalness
            ratings['naturalness'] = self._get_rating(
                "2. Naturalness - Apakah terdengar natural, bukan terjemahan? (1-10)"
            )

            # Register appropriateness
            ratings['register'] = self._get_rating(
                "3. Register - Apakah tingkat formalitas sesuai konteks? (1-10)"
            )

            # Cultural appropriateness
            ratings['cultural'] = self._get_rating(
                "4. Cultural - Apakah secara budaya pas dan sensitif? (1-10)"
            )

            # Overall preference
            ratings['overall'] = self._get_rating(
                "5. Overall - Rating keseluruhan (1-10)"
            )

            # Qualitative feedback
            print("\n6. Feedback kualitatif:")
            print("   - Bagian mana yang terdengar 'ingessato' (kaku)?")
            print("   - Kata/frasa apa yang sebaiknya diganti?")
            print("   - Saran perbaikan?")
            feedback = input("\nFeedback: ").strip()

            # Store results
            self.results.append({
                "query": query,
                "response": response['text'],
                "model": response['model'],
                "ratings": ratings,
                "feedback": feedback,
                "timestamp": datetime.now().isoformat()
            })

            # Show summary
            avg_score = sum(ratings.values()) / len(ratings)
            print(f"\n📊 Average Score: {avg_score:.1f}/10")

            if avg_score < 7.0:
                print("⚠️  LOW SCORE - Needs improvement")
            elif avg_score >= 8.5:
                print("✅ EXCELLENT - Natural Indonesian")

        # Session summary
        self._print_summary()

        # Save results
        self._save_results()

    def _get_rating(self, prompt: str) -> float:
        """Get rating from reviewer"""
        while True:
            try:
                rating = float(input(f"{prompt}: "))
                if 1 <= rating <= 10:
                    return rating
                print("Please enter a number between 1 and 10")
            except ValueError:
                print("Please enter a valid number")

    def _print_summary(self):
        """Print session summary"""
        print("\n" + "="*80)
        print("SESSION SUMMARY")
        print("="*80)

        if not self.results:
            return

        # Calculate averages
        avg_ratings = {
            'comprehensibility': 0,
            'naturalness': 0,
            'register': 0,
            'cultural': 0,
            'overall': 0
        }

        for result in self.results:
            for key in avg_ratings:
                avg_ratings[key] += result['ratings'][key]

        n = len(self.results)
        for key in avg_ratings:
            avg_ratings[key] /= n

        print(f"\nAverage Scores (n={n}):")
        print(f"  Comprehensibility: {avg_ratings['comprehensibility']:.1f}/10")
        print(f"  Naturalness:       {avg_ratings['naturalness']:.1f}/10")
        print(f"  Register:          {avg_ratings['register']:.1f}/10")
        print(f"  Cultural:          {avg_ratings['cultural']:.1f}/10")
        print(f"  Overall:           {avg_ratings['overall']:.1f}/10")

        # Flag problem areas
        print("\n🎯 Focus Areas:")
        if avg_ratings['naturalness'] < 7.0:
            print("  ⚠️  NATURALNESS - Responses sound too robotic/formal")
        if avg_ratings['register'] < 7.0:
            print("  ⚠️  REGISTER - Formality level often inappropriate")
        if avg_ratings['cultural'] < 7.0:
            print("  ⚠️  CULTURAL - Missing cultural sensitivity")

        # Recommendations
        print("\n💡 Recommendations:")
        if avg_ratings['overall'] < 7.0:
            print("  → Consider switching to SEA-LION v4 or SahabatAI")
            print("  → Enhance prompt engineering with v7.0 natural patterns")
        elif avg_ratings['overall'] < 8.5:
            print("  → Fine-tune prompts based on specific feedback")
            print("  → Consider A/B testing with regional models")

    def _save_results(self):
        """Save results to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"indonesian_quality_review_{timestamp}.json"
        filepath = Path(__file__).parent.parent / "evaluation_results" / filename

        filepath.parent.mkdir(exist_ok=True)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump({
                "session_date": datetime.now().isoformat(),
                "total_queries": len(self.results),
                "results": self.results
            }, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Results saved to: {filepath}")

# Usage
if __name__ == "__main__":
    # Test queries from real usage
    TEST_QUERIES = [
        "Berapa lama proses KITAS?",
        "Saya mau buka usaha kopi di Bali. KBLI apa yang cocok?",
        "Apa bedanya PT dengan PT PMA?",
        "Gimana cara perpanjang HGB?",
        "Kalau mau hiring expat, prosesnya gimana?",
        "Berapa modal minimal untuk PT PMA?",
        "Apa itu NPWP dan gimana cara bikinnya?",
        "Saya orang asing, bisa beli rumah di Indonesia?",
        "Untuk visa investor, dokumen apa aja yang diperlukan?",
        "Pajak untuk PT PMA berapa persen?"
    ]

    # Initialize with your client
    from llm.multi_model_client import MultiModelClient
    client = MultiModelClient()

    # Run review
    reviewer = IndonesianQualityReview(client)
    asyncio.run(reviewer.run_review_session(TEST_QUERIES))
```

### Jadwal Review

```
Frequenza: Settimanale (ogni Venerdì pomeriggio)
Durata: 1 ora
Partecipanti: 2-3 native speakers dal team indonesiano
Queries: 10-15 per sessione (mix di nuove e problematiche)
Output: Ratings + feedback qualitativo → prompt improvements
```

---

## Quick Start Checklist

**Week 1**:
- [ ] Setup SEA-LION v4 client (o SahabatAI se disponibile)
- [ ] Deploy prompt v7.0 con natural language patterns
- [ ] Test su 50 query reali dal team
- [ ] First native speaker review session

**Week 2**:
- [ ] Compare SEA-LION vs Llama Scout vs GPT-4 su 20 query
- [ ] Analizzare feedback team su naturalezza
- [ ] Decision: quale modello per production?
- [ ] Deploy modello scelto

**Month 1**:
- [ ] Weekly reviews con team indonesiano
- [ ] Iterare su prompt basandosi su feedback
- [ ] Collect 100+ query-response pairs annotati
- [ ] Misurare improvement: target >85% satisfaction

---

## Metriche di Successo

**Baseline (attuale)**:
- Comprehensibility: ~60-70% (team fatica a capire)
- Naturalness: ~5-6/10 (ingessato)
- Team satisfaction: ~50%

**Target (dopo implementazione)**:
- Comprehensibility: >95%
- Naturalness: >8/10
- Team satisfaction: >85%

**Misurazione**:
- Weekly native speaker reviews
- User feedback dopo conversazioni reali
- A/B testing: vecchio vs nuovo sistema

---

## Risorse e Contatti

**SEA-LION**:
- Website: https://sea-lion.ai
- GitHub: https://github.com/aisingapore/sealion
- Contact: AI Singapore

**SahabatAI**:
- Research via We SUPA AI Blog
- Verificare disponibilità commerciale

**Komodo-7B**:
- Provider: Yellow.AI
- Website: https://yellow.ai

**Alternative**: Llama 4 Scout con enhanced prompting (già in uso in Nuzantara)

---

## Support

Per domande sull'implementazione:
1. Consultare analisi completa: `docs/analysis/ANALISI_BAHASA_INDONESIA_AI_WORLDWIDE.md`
2. Review esempi comparativi in Appendice A
3. Test con team indonesiano prima del deploy in production

**Success criteria**: Quando il team dice "Finalmente capisco!" e "Suona naturale!" ✅
