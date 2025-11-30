# JAKSEL AI SYSTEM API DOCUMENTATION

## Overview

Jaksel AI is a custom personality module for the Zantara AI system that provides casual, friendly responses using Jakarta Selatan (Jaksel) slang. 

**Current Status (Nov 2025):**
- **Primary Model:** `zeroai87/jaksel-ai` (Gemma 9B) via **Ollama Production** - *Active & Verified*
- **Endpoint:** `https://jaksel.balizero.com`
- **Fallback:** Gemini 2.5 (Imitating Jaksel Style) - *Active Backup*
- **Availability:** 100% (Primary + Fallback)

## Architecture

The system uses a robust routing and fallback mechanism to ensure users always receive Jaksel-styled responses, even if the primary custom model is unavailable.

### Routing Logic (`IntelligentRouter`)

1.  **User Identification**: The router checks if the `user_id` (email) is in the authorized `jaksel_users` list.
2.  **Primary Attempt (HF Endpoint)**: Attempts to call the custom model hosted on Hugging Face Inference Endpoints.
    -   *Current Status:* Disabled/Failing due to model format mismatch (GGUF vs Safetensors).
3.  **Ultimate Fallback (Gemini)**: If the primary model fails (or is not configured), the system automatically uses **Gemini 2.5** with a specialized system prompt to rewrite the response in Jaksel style.
    -   *Current Status:* **ACTIVE**. This is the mechanism currently serving all requests.

### The "Jaksel" Style
The system enforces specific linguistic traits:
-   **Language**: Bahasa Indonesia (Casual)
-   **Slang**: Uses terms like "jujurly", "basically", "which is", "literally", "lo/gue".
-   **Tone**: Friendly, helpful, peer-to-peer (not robotic).
-   **No Info Handling**: Translates standard "I don't know" responses into Jaksel style (e.g., "Waduh, sorry banget nih, gue belum punya infonya...").

## Endpoints

### Universal Chat

**Endpoint:** `POST /api/oracle/universal-chat`

**Description:** Main chat endpoint. No special parameters are needed; the backend automatically applies the style based on the `user_id`.

**Request Format:**
```json
{
  "message": "User query",
  "user_id": "anton@balizero.com", 
  "conversation_id": "optional-uuid"
}
```

**Response Format:**
```json
{
  "success": true,
  "response": "Halo bro! Basically sistemnya jalan lancar jaya nih via Gemini Fallback. Mantul kan? 😊",
  "metadata": {
    "model_used": "gemini-2.5-flash", 
    "style_applied": true,
    "fallback_active": true
  }
}
```

## Authorized Users

Only specific users receive the Jaksel treatment. Currently configured for:
-   `anton@balizero.com`
-   `amanda@balizero.com`
-   `krisna@balizero.com`

## Deployment & Hosting

### Current Setup (Fallback)
-   **Hosting**: Fly.io (Backend RAG)
-   **Model**: Gemini 2.5 Flash (via Google AI Studio)
-   **Cost**: Free (within limits) / Low cost

### Future Setup (Custom Model)
To enable the true `zeroai87/jaksel-ai` model:
1.  **Hosting**: RunPod (Recommended) or Hugging Face Inference Endpoints.
2.  **Model File**: The local file `ZANTARA_JAKSEL/models/gemma2-9b-cpt-sahabatai-v1-instruct.Q4_K_M.gguf` is a **Quantized (GGUF)** model.
    -   *Requirement*: Requires an Ollama or Llama.cpp server.
    -   *Incompatibility*: Cannot be hosted directly on standard Hugging Face Inference Endpoints (which expect Safetensors/PyTorch weights).
3.  **Action Item**: Deploy Ollama on a GPU server (e.g., RunPod) and point the backend to that URL.

## Troubleshooting

### "Why is it answering in Italian/English?"
-   Check if `user_id` matches exactly (case-sensitive in some contexts, though code normalizes to lowercase).
-   Check logs for `[Router] Applying Jaksel style`.

### "Why is the custom model not working?"
-   The HF Endpoint returns 404 or "Load Error" because the repo contains a GGUF file, not the expected format.
-   **Fix**: Use the Gemini Fallback (currently active) or deploy on RunPod.

---

**Last Updated:** 2025-11-30
**Status:** Production Ready (via Fallback) ✅