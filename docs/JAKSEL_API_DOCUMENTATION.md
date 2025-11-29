# JAKSEL AI SYSTEM API DOCUMENTATION

## Overview

Jaksel AI is a custom Gemma 9B model fine-tuned with Jakarta Selatan personality that provides casual and friendly responses with Indonesian slang. The system includes automatic translation capabilities for Italian queries and multi-level fallback infrastructure for high availability.

## Architecture

### Core Components

1. **SimpleJakselCallerTranslation** - Main service handling Jaksel AI interactions
2. **Multi-level Fallback System** - Ensures 99%+ uptime
3. **Translation Layer** - Automatic Indonesian → Italian translation
4. **User Authorization** - Only authorized users receive Jaksel responses

### API Integration

The Jaksel system is integrated into the main NUZANTARA platform through the `/api/oracle/universal-chat` endpoint in the backend-rag service.

## Endpoints

### Universal Chat (with Jaksel Integration)

**Endpoint:** `POST /api/oracle/universal-chat`

**Description:** Main chat endpoint that automatically routes authorized users to Jaksel AI system

**Request Format:**
```json
{
  "message": "User query",
  "user_id": "user@example.com",
  "conversation_id": "optional-conversation-id",
  "context": "optional-context"
}
```

**Response Format (Jaksel Users):**
```json
{
  "success": true,
  "response": "Jaksel-style response (automatically translated if needed)",
  "metadata": {
    "model_used": "huggingface-jaksel-ai",
    "connected_via": "huggingface-inference-api",
    "translated": true,
    "query_language": "Italiano",
    "user_name": "Anton",
    "original_response": "Original Indonesian response"
  }
}
```

**Response Format (Non-Jaksel Users):**
```json
{
  "success": true,
  "response": "Professional AI response (Gemini/Default model)",
  "metadata": {
    "model_used": "gemini-pro"
  }
}
```

## Authorized Users

Only users in the `jaksel_users` mapping receive Jaksel-style responses:

```python
jaksel_users = {
    "anton@balizero.com": "Anton",
    "amanda@balizero.com": "Amanda",
    "krisna@balizero.com": "Krisna"
}
```

## Fallback System

The Jaksel system implements a 4-tier fallback architecture:

### Tier 1: Hugging Face Inference API (Primary)
- **Endpoint:** `https://api-inference.huggingface.co/models/zeroai87/jaksel-ai`
- **Status:** Primary production endpoint
- **Reliability:** ~95% uptime

### Tier 2: Hugging Face Spaces (Fallback 1)
- **Endpoint:** `https://zeroai87-jaksel-ai.hf.space/api/generate`
- **Status:** Backup endpoint
- **Activation:** When Tier 1 fails

### Tier 3: Ollama via Tunnel (Fallback 2)
- **Endpoint:** `https://jaksel-ollama.nuzantara.com/api/generate`
- **Status:** Self-hosted backup
- **Activation:** When Tiers 1-2 fail

### Tier 4: Local Ollama (Fallback 3)
- **Endpoint:** `http://127.0.0.1:11434/api/generate`
- **Status:** Development/local fallback
- **Activation:** When Tiers 1-3 fail

## Translation System

### Language Detection

The system automatically detects query language using keyword matching:

```python
def detect_language(text: str) -> str:
    if any(word in text.lower() for word in ["ciao", "come", "italiano", "grazie"]):
        return "Italiano"
    elif any(word in text.lower() for word in ["halo", "apa", "bagaimana", "terima"]):
        return "Bahasa Indonesia"
    else:
        return "Bahasa Indonesia"  # Default
```

### Translation Process

1. **Query Detection**: System detects if query is in Italian
2. **Jaksel Response**: Model responds in natural Indonesian with Jaksel personality
3. **Automatic Translation**: If query was Italian, response is automatically translated
4. **Personality Preservation**: Jaksel personality traits maintained in translation

### Translation API

- **Service**: Google Translate API
- **Languages Supported**: Indonesian ↔ Italian
- **Preservation**: Jaksel slang and personality traits

## Model Information

### Base Model
- **Model**: Gemma 9B
- **Fine-tuned by**: Bali Zero team
- **Personality**: Jakarta Selatan casual style
- **Language**: Native Bahasa Indonesia

### Personality Traits
- **Style**: Casual, friendly, Jakarta Selatan slang
- **Common Phrases**: "bro", "sis", "banget", "canggih", "gua", "lu"
- **Tone**: Informal, helpful, contemporary
- **Vocabulary**: Modern Indonesian slang with Jakarta influence

### Hugging Face Details
- **Model URL**: https://huggingface.co/zeroai87/jaksel-ai
- **Inference API**: Available via Hugging Face Inference API
- **Spaces**: Available via Hugging Face Spaces
- **License**: Custom (team use only)

## Error Handling

### Fallback Responses

When all Jaksel endpoints fail, the system provides graceful fallback:

```python
jaksel_fallback = f"""Halo Kak {user_name}! Maaf banget nih, Jaksel lagi nggak bisa konek ke server sekarang.

Coba lagi ya sebentar! Sementara ini, jawaban profesionalnya:

{gemini_answer}

Jaksel bakal balik dengan gaya yang lebih asyik lagi kalau server udah normal lagi! 😊"""
```

### Error Monitoring

The system logs all:
- Connection attempts and results
- Response times and success rates
- Translation successes/failures
- Fallback activations
- User language detection accuracy

## Deployment Status

- **Production**: ✅ Deployed on Fly.io
- **URL**: https://nuzantara-rag.fly.dev
- **Health**: Active monitoring
- **Scaling**: Automatic scaling based on load
- **Monitoring**: Structured logging with correlation IDs

## Usage Examples

### Italian Query (Translated Response)
```json
{
  "message": "Ciao Jaksel, come funziona il sistema?",
  "user_id": "anton@balizero.com"
}
```

**Response:**
```
Ciao bro! Il sistema funziona con un'intelligenza artificiale super avanzata che processa le tue domande in tempo reale. Praticamente molto canggih!

Il sistema usa una combinazione di modelli linguistici e database vettoriali per dare risposte precise e contestuali. Banget, vero? 😊
```

### Indonesian Query (Native Response)
```json
{
  "message": "Halo Jaksel, gimana cara kerja sistemnya?",
  "user_id": "anton@balizero.com"
}
```

**Response:**
```
Halo bro! Sistemnya jalan dengan AI yang super canggih nih, proses pertanyaan elo secara real-time.

Kombinasi model bahasa dan vektor database buat kasih jawaban yang akurat. Gua udah test, hasilnya mantul banget! Ada yang mau ditanya lagi? 😊
```

## Monitoring & Observability

### Key Metrics
- **Success Rate**: Target >95%
- **Response Time**: Target <5 seconds
- **Translation Accuracy**: Target >90%
- **Fallback Rate**: Target <5%

### Log Examples
```
INFO: 🚀 SimpleJakselCallerTranslation called for user: anton@balizero.com
INFO: 🌍 Query language detected: Italiano
INFO: 📡 HF Inference API response status: 200
INFO: ✅ SUCCESS: Jaksel responded via HF Inference API
INFO: 🔄 Translating Indonesian response to Italian...
```

## Integration Guide

### For Developers

To integrate with the Jaksel system:

1. **Use the Universal Endpoint**: Call `/api/oracle/universal-chat`
2. **Authorized Users**: Ensure user emails are in `jaksel_users` mapping
3. **Language Support**: System automatically detects and translates
4. **Error Handling**: Implement fallback for failed responses
5. **Monitoring**: Track response metadata for debugging

### Code Example

```python
import requests

def chat_with_jaksel(message, user_email):
    response = requests.post(
        "https://nuzantara-rag.fly.dev/api/oracle/universal-chat",
        json={
            "message": message,
            "user_id": user_email
        }
    )

    if response.status_code == 200:
        data = response.json()
        return data.get("response"), data.get("metadata")
    else:
        return None, None

# Usage
response, metadata = chat_with_jaksel(
    "Ciao Jaksel, come va?",
    "anton@balizero.com"
)

print(f"Response: {response}")
print(f"Model: {metadata.get('model_used')}")
print(f"Translated: {metadata.get('translated')}")
```

## Troubleshooting

### Common Issues

1. **User Not Receiving Jaksel Responses**
   - Check if user email is in `jaksel_users` mapping
   - Verify email format matches exactly

2. **Translation Not Working**
   - Check if query contains Italian keywords
   - Verify Google Translate API connectivity

3. **Slow Responses**
   - Check which fallback tier is being used
   - Monitor response times in logs

4. **All Endpoints Failing**
   - Verify Hugging Face API key validity
   - Check network connectivity
   - Review rate limiting status

### Health Checks

Monitor Jaksel system health:
```bash
# Check recent Jaksel calls
fly -a nuzantara-rag logs | grep "SimpleJakselCaller" | tail -20

# Check success rates
fly -a nuzantara-rag logs | grep "SUCCESS\|FAILED" | tail -50
```

---

**Last Updated:** 2025-11-29
**Version:** 2.0
**Status:** Production Ready ✅

For more information, contact the NUZANTARA development team.