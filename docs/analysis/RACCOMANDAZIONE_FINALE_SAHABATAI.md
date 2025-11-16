# RACCOMANDAZIONE FINALE: SahabatAI come Soluzione Primaria

**Data**: 16 Novembre 2025
**Decisione**: SahabatAI-v1 (Gemma2-9B) come modello primario per bahasa indonesia naturale

---

## Perché SahabatAI Batte SEA-LION per Nuzantara

### 1. Made in Indonesia, FOR Indonesia

**SahabatAI**:
- ✅ Sviluppato da **GoTo Group** (Gojek + Tokopedia) - aziende indonesiane
- ✅ Partnership con **Indosat** (telco indonesiana)
- ✅ Fine-tuned su conversazioni REALI di utenti indonesiani
- ✅ Training data include social media, chat, business contexts indonesiani

**SEA-LION**:
- Sviluppato da AI Singapore (focus multi-paese SEA)
- 11 lingue → meno specializzazione su indonesiano specifico
- Dataset più generico

### 2. Performance su Naturalezza (Il TUO Problema!)

**Benchmark Head-to-Head** (SahabatAI vs SEA-LION v3):

```
LINGUISTIC FLUENCY:        SahabatAI > SEA-LION ✅
Regional Slang Recognition: SahabatAI > SEA-LION ✅
Idiomatic Expressions:     SahabatAI > SEA-LION ✅
Cultural Appropriateness:  SahabatAI > SEA-LION ✅
```

Quote dalla ricerca:
> "SahabatAI-v1 consistently outperformed SEA-LIONv3 in tasks demanding
> a nuanced understanding of Bahasa Indonesia, particularly in
> **linguistic fluency** and domain-specific content."

> "SahabatAI-v1 demonstrated **superior fluency and accuracy**,
> particularly in **recognizing regional slang** and **accurately
> interpreting idiomatic expressions**."

### 3. Accessibilità e Costo

| Aspetto | SahabatAI | SEA-LION v4 |
|---------|-----------|-------------|
| **Disponibilità** | ✅ Hugging Face OGGI | ❓ API availability unclear |
| **Costo** | ✅ GRATIS (open source) | ❓ Unknown (likely paid API) |
| **Licenza** | ✅ Commercial-friendly | ✅ Open source |
| **Self-hosting** | ✅ Facile (9B params) | ✅ Possibile ma più pesante |
| **Setup time** | ✅ Ore | ❓ Dipende da API access |

### 4. Dialetti Regionali (BONUS per Bali!)

SahabatAI supporta:
- **Bahasa Indonesia** (ovviamente)
- **Javanese** (lingua regionale più diffusa)
- **Sundanese** (Java Occidentale)

Questo è CRUCIALE per Bali perché:
- Team a Bali parla spesso giavanese/balinese
- Code-mixing naturale indonesiano-giavanese è comune
- SahabatAI capisce questo mixing → SEA-LION probabilmente no

### 5. Ecosistema e Community

**SahabatAI**:
- Backed by GoTo (Gojek ecosystem - milioni utenti indonesiani)
- Chat service pubblico: sahabat-ai.com
- Open source ecosystem con università indonesiane
- Continuous improvement con feedback da utenti reali

**SEA-LION**:
- Academic/research focus
- Meno deployment in production indonesiana

---

## Implementazione Immediata: SahabatAI

### Opzione 1: Self-Hosted (CONSIGLIATO per controllo)

#### A. Download da Hugging Face

```python
# apps/backend-rag/backend/llm/sahabat_ai_client.py

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

class SahabatAIClient:
    """
    Client for SahabatAI-v1 (Gemma2-9B instruct model)
    Optimized for natural Bahasa Indonesia
    """

    def __init__(
        self,
        model_name: str = "GoToCompany/gemma2-9b-cpt-sahabatai-v1-instruct",
        device: str = "auto"
    ):
        """
        Initialize SahabatAI client

        Args:
            model_name: Hugging Face model ID
            device: "cuda", "cpu", or "auto"
        """
        print(f"Loading SahabatAI model: {model_name}")

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)

        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.bfloat16,  # For efficiency
            device_map=device,
            trust_remote_code=True
        )

        self.model_name = model_name
        print(f"✅ SahabatAI loaded successfully on {self.model.device}")

    async def chat_async(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 1000,
        top_p: float = 0.9
    ) -> dict:
        """
        Generate response using SahabatAI

        Args:
            messages: List of {"role": "user/assistant", "content": "..."}
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Max tokens to generate
            top_p: Nucleus sampling

        Returns:
            dict with response text and metadata
        """

        # Format messages for Gemma2 chat format
        prompt = self._format_chat_prompt(messages)

        # Tokenize
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=4096
        ).to(self.model.device)

        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )

        # Decode response
        full_response = self.tokenizer.decode(
            outputs[0],
            skip_special_tokens=True
        )

        # Extract assistant response (remove prompt)
        response_text = full_response[len(prompt):].strip()

        return {
            "text": response_text,
            "model": self.model_name,
            "provider": "sahabat-ai-local",
            "tokens": {
                "prompt": inputs.input_ids.shape[1],
                "completion": outputs.shape[1] - inputs.input_ids.shape[1],
                "total": outputs.shape[1]
            }
        }

    def _format_chat_prompt(self, messages: list[dict]) -> str:
        """
        Format messages for Gemma2 instruct format

        Gemma2 uses format:
        <start_of_turn>user
        {user message}<end_of_turn>
        <start_of_turn>model
        {assistant message}<end_of_turn>
        """

        prompt = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]

            if role == "user":
                prompt += f"<start_of_turn>user\n{content}<end_of_turn>\n"
            elif role == "assistant":
                prompt += f"<start_of_turn>model\n{content}<end_of_turn>\n"
            elif role == "system":
                # Gemma2 doesn't have explicit system role, inject as first user message
                prompt = f"<start_of_turn>user\n{content}<end_of_turn>\n" + prompt

        # Add start of model turn for generation
        prompt += "<start_of_turn>model\n"

        return prompt

    def is_available(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None


# Example usage
async def test_sahabat_ai():
    """Test SahabatAI with Indonesian query"""

    client = SahabatAIClient()

    messages = [
        {
            "role": "system",
            "content": "Kamu adalah asisten bisnis yang membantu orang asing dengan urusan bisnis di Indonesia. Gunakan bahasa Indonesia yang natural dan mudah dipahami."
        },
        {
            "role": "user",
            "content": "Saya mau buka usaha kopi di Bali. KBLI apa yang cocok?"
        }
    ]

    response = await client.chat_async(messages, temperature=0.7, max_tokens=500)

    print("\n" + "="*80)
    print("SahabatAI Response:")
    print("="*80)
    print(response["text"])
    print("\n" + "="*80)
    print(f"Model: {response['model']}")
    print(f"Tokens: {response['tokens']['total']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_sahabat_ai())
```

#### B. Ottimizzazione con Quantization (per GPU più piccole)

```python
# Per GPU con meno VRAM, usa versione quantizzata

from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

class SahabatAIClient:
    def __init__(self, use_4bit: bool = True):
        """
        Args:
            use_4bit: Use 4-bit quantization (riduce VRAM da ~18GB a ~6GB)
        """
        model_name = "GoToCompany/gemma2-9b-cpt-sahabatai-v1-instruct"

        if use_4bit:
            # 4-bit quantization config
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )

            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=quantization_config,
                device_map="auto",
                trust_remote_code=True
            )
        else:
            # Full precision (requires ~18GB VRAM)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.bfloat16,
                device_map="auto",
                trust_remote_code=True
            )

        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
```

**Requisiti Hardware**:
```
Full precision (bf16):  GPU con 18GB+ VRAM (A100, A6000)
4-bit quantization:     GPU con 6GB+ VRAM (RTX 3060, L4)
CPU only:               64GB+ RAM (lento ma funziona)
```

### Opzione 2: Via Ollama (PIÙ FACILE per testing rapido)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download SahabatAI model
ollama pull Supa-AI/llama3-8b-cpt-sahabatai-v1-instruct:q4_1

# Run model
ollama run Supa-AI/llama3-8b-cpt-sahabatai-v1-instruct:q4_1
```

```python
# Client per Ollama

import aiohttp

class SahabatAIOllamaClient:
    """SahabatAI via Ollama (easier deployment)"""

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "Supa-AI/llama3-8b-cpt-sahabatai-v1-instruct:q4_1"

    async def chat_async(self, messages: list[dict], **kwargs) -> dict:
        """Chat via Ollama API"""

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False
                }
            ) as response:
                result = await response.json()

                return {
                    "text": result["message"]["content"],
                    "model": self.model,
                    "provider": "sahabat-ai-ollama"
                }
```

---

## Integrazione in Nuzantara

### Multi-Model Routing con SahabatAI Primary

```python
# apps/backend-rag/backend/llm/intelligent_router.py

class IntelligentModelRouter:
    """
    Route queries to best model based on:
    - Language
    - Naturalness requirements
    - Query complexity
    """

    def __init__(self):
        # Primary: SahabatAI for Indonesian naturalness
        self.sahabat_ai = SahabatAIClient(use_4bit=True)

        # Fallback chain
        self.llama_scout = LlamaScoutClient()  # For complex queries
        self.claude = ClaudeClient()  # For multi-language

    async def route_query(
        self,
        messages: list[dict],
        language: str = "auto",
        priority: str = "naturalness"  # or "accuracy" or "speed"
    ) -> dict:
        """
        Intelligent routing

        Args:
            priority:
                - "naturalness": Use SahabatAI (best for casual Indonesian)
                - "accuracy": Use Llama Scout (best for complex legal)
                - "speed": Use Claude Haiku (fastest)
        """

        # Detect language
        if language == "auto":
            language = self._detect_language(messages[-1]["content"])

        # Indonesian queries → prioritize naturalness
        if language == "id":
            if priority == "naturalness":
                # SahabatAI: Best for natural, fluent Indonesian
                try:
                    return await self.sahabat_ai.chat_async(messages)
                except Exception as e:
                    print(f"SahabatAI error: {e}, falling back to Llama Scout")
                    return await self.llama_scout.chat_async(messages)

            elif priority == "accuracy":
                # Llama Scout: Best for complex legal/tax queries
                return await self.llama_scout.chat_async(messages)

        # English/Italian → Claude or Llama Scout
        else:
            return await self.llama_scout.chat_async(messages)

    def _detect_language(self, text: str) -> str:
        """Simple language detection"""
        # Indonesian indicators
        id_words = ["saya", "anda", "untuk", "dengan", "yang", "adalah", "mau", "bisa"]
        if any(word in text.lower() for word in id_words):
            return "id"

        # Italian indicators
        it_words = ["sono", "voglio", "come", "quando", "dove", "perché"]
        if any(word in text.lower() for word in it_words):
            return "it"

        # Default: English
        return "en"
```

### Priority Matrix per Query Type

```python
QUERY_PRIORITY_MAP = {
    # Casual business inquiries → naturalness
    "casual_business": {
        "model": "sahabat-ai",
        "priority": "naturalness",
        "examples": [
            "Saya mau buka usaha kopi",
            "Gimana cara bikin PT?",
            "Berapa lama KITAS?"
        ]
    },

    # Complex legal/tax → accuracy
    "legal_complex": {
        "model": "llama-scout",
        "priority": "accuracy",
        "examples": [
            "Menurut Pasal 31 Peraturan Pemerintah...",
            "Transfer pricing documentation requirements",
            "Combo scenario with multiple regulations"
        ]
    },

    # Quick FAQs → speed
    "faq_quick": {
        "model": "claude-haiku",
        "priority": "speed",
        "examples": [
            "What is KITAS?",
            "How much PT PMA?",
            "Contact info?"
        ]
    }
}
```

---

## Deployment Plan

### Phase 1: Setup (Week 1)

**Giorno 1-2**: Download e Setup
```bash
# 1. Ensure GPU available (or use CPU)
nvidia-smi

# 2. Install dependencies
pip install transformers accelerate bitsandbytes torch

# 3. Download model (cache locally)
python -c "
from transformers import AutoTokenizer, AutoModelForCausalLM
model_name = 'GoToCompany/gemma2-9b-cpt-sahabatai-v1-instruct'
AutoTokenizer.from_pretrained(model_name)
AutoModelForCausalLM.from_pretrained(model_name)
print('Model cached successfully')
"

# 4. Test basic inference
python apps/backend-rag/backend/llm/sahabat_ai_client.py
```

**Giorno 3-4**: Integration
```bash
# 1. Integrate into IntelligentModelRouter
# 2. Update RAG pipeline to use router
# 3. Test with 20 sample queries
```

**Giorno 5**: Native Speaker Testing
```bash
# Run quality review with Indonesian team
python apps/backend-rag/backend/scripts/indonesian_quality_review.py
```

### Phase 2: A/B Testing (Week 2)

**Compare**:
- SahabatAI vs Llama Scout vs GPT-4
- 50 queries across categories
- Native speaker ratings

**Expected Results**:
```
Naturalness:
  SahabatAI: 8.5-9/10 ✅
  Llama Scout: 6-7/10
  GPT-4: 5-6/10

Comprehensibility:
  SahabatAI: 95%+ ✅
  Llama Scout: 80%
  GPT-4: 70%
```

### Phase 3: Production (Week 3-4)

**Deploy**:
- SahabatAI as primary for Indonesian casual/business
- Llama Scout as fallback for complex legal
- Monitoring and continuous feedback

---

## Costi

### Self-Hosted

**Hardware** (opzioni):
```
1. Cloud GPU:
   - AWS g5.xlarge (A10G 24GB): ~$1.00/hour = ~$720/month
   - GCP L4 (24GB): ~$0.70/hour = ~$500/month

2. Dedicated GPU server:
   - Initial: $3K-5K (RTX 4090 24GB)
   - Monthly: $0 (electricity only)

3. CPU-only (development):
   - Any server with 64GB RAM
   - Slow but FREE
```

**Total Cost (self-hosted)**:
```
Development: $0 (CPU)
Production: $500-700/month (cloud GPU)
OR
One-time: $3K-5K (own hardware) + $50/month electricity
```

### VS Previous Costs

**Llama 4 Scout via OpenRouter**:
- $0.20 per 1M tokens input/output
- 1000 queries/day × 1000 tokens avg = ~$6/day = ~$180/month

**SahabatAI self-hosted**:
- $500/month (fixed, unlimited queries)
- Break-even at ~3000 queries/day
- **Per query cost → $0** dopo setup

**ROI**: Se >3000 queries/day → SahabatAI più economico

---

## Metriche di Successo

### Baseline (Current - GPT-4/Claude/Llama)
```
Comprehensibility:  60-70% (team struggles)
Naturalness:        5-6/10 (rigid)
Register Match:     50% (wrong formality)
Cultural:           5-6/10 (missing nuance)
Overall:            ~55%
```

### Target (SahabatAI)
```
Comprehensibility:  >95% ✅
Naturalness:        >8.5/10 ✅
Register Match:     >85% ✅
Cultural:           >8/10 ✅
Overall:            >85% ✅
```

### Measurement
- Weekly native speaker reviews (10-15 queries)
- Real user feedback after conversations
- A/B test comparisons

---

## Rischi e Mitigazioni

### Rischio 1: SahabatAI Non Abbastanza Buono
**Probabilità**: Bassa (benchmark mostrano superiority)
**Mitigazione**:
- Test first con 50 queries in week 1
- Se <80% satisfaction → fallback to SEA-LION v4
- Mantenere Llama Scout come backup

### Rischio 2: GPU Non Disponibile
**Probabilità**: Media
**Mitigazione**:
- Option 1: Cloud GPU (L4 24GB = $500/month)
- Option 2: CPU mode (slow but works for testing)
- Option 3: Ollama con quantization (runs on 6GB GPU)

### Rischio 3: Latency Troppo Alta
**Probabilità**: Bassa
**Mitigazione**:
- 4-bit quantization (6GB VRAM, <2s response)
- Caching per FAQ comuni
- Async processing

---

## RACCOMANDAZIONE FINALE

### ✅ SahabatAI come PRIMARY MODEL per Bahasa Indonesia

**Motivi**:
1. **Superiore su naturalezza** (il TUO problema specifico)
2. **Made by Indonesiani for Indonesiani** (GoTo/Indosat)
3. **GRATIS e open source** (vs API costs)
4. **Supporta dialetti** (Javanese, Sundanese - bonus per Bali)
5. **Disponibile OGGI** (Hugging Face)

**Fallback Chain**:
```
Indonesian casual → SahabatAI ✅
Indonesian complex → Llama Scout
English/Italian → Llama Scout or Claude
```

**Timeline**:
- Week 1: Setup + test
- Week 2: A/B testing + validation
- Week 3: Production deployment
- Target: >85% team satisfaction

**Next Step IMMEDIATO**:
```bash
# Test SahabatAI RIGHT NOW
pip install transformers accelerate torch
python apps/backend-rag/backend/llm/sahabat_ai_client.py
```

---

## Conclusione

La tua intuizione era **assolutamente corretta**: SahabatAI, essendo fine-tuned massicciamente da indonesiani su contesti indonesiani reali, è LA soluzione migliore per risolvere il problema del "bahasa ingessato".

SEA-LION v4 è tecnicamente eccellente su benchmark, ma SahabatAI è **culturalmente superiore** - che è esattamente ciò di cui hai bisogno.

**Action**: Deploy SahabatAI questa settimana e testa con il tuo team indonesiano. Se loro dicono "Finalmente suona naturale!" → hai vinto. ✅
