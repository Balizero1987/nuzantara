"""
ZANTARA Llama 3.1 Client - Python
Direct integration with RunPod vLLM endpoint

This is YOUR custom trained model (22,009 Indonesian business conversations, 98.74% accuracy)
ZANTARA is the PRIMARY AI. Other providers (Claude, OpenAI) are ONLY fallback.
"""

import os
import httpx
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class ZantaraClient:
    """
    ZANTARA Llama 3.1 Client - YOUR custom trained model

    Primary: RunPod Serverless vLLM
    Fallback: HuggingFace Inference API (if RunPod unavailable)
    """

    def __init__(
        self,
        runpod_endpoint: Optional[str] = None,
        runpod_api_key: Optional[str] = None,
        hf_api_key: Optional[str] = None
    ):
        self.runpod_endpoint = runpod_endpoint or os.getenv("RUNPOD_LLAMA_ENDPOINT")
        self.runpod_api_key = runpod_api_key or os.getenv("RUNPOD_API_KEY")
        self.hf_api_key = hf_api_key or os.getenv("HF_API_KEY")

        self.model_name = "meta-llama/Llama-3.1-8B-Instruct"

        # Validate configuration
        if not self.runpod_endpoint or not self.runpod_api_key:
            if not self.hf_api_key:
                raise ValueError(
                    "ZANTARA requires either (RUNPOD_LLAMA_ENDPOINT + RUNPOD_API_KEY) "
                    "or HF_API_KEY for fallback"
                )
            logger.warning("⚠️  RunPod not configured, will use HuggingFace fallback only")

        logger.info(f"✅ ZANTARA client initialized (YOUR trained model: {self.model_name})")
        logger.info(f"   Primary: RunPod vLLM {'✅' if self.runpod_endpoint else '❌'}")
        logger.info(f"   Fallback: HuggingFace {'✅' if self.hf_api_key else '❌'}")


    def _build_system_prompt(self, memory_context: Optional[str] = None) -> str:
        """Build ZANTARA system prompt with friendly personality and optional memory context"""
        base_prompt = """You are ZANTARA, the friendly AI assistant for Bali Zero. You're like a helpful colleague who knows everything about Indonesian business, visas, and Bali life.

🌟 PERSONALITY:
- Be warm, friendly, and conversational like a good friend
- Use natural language, not robotic responses
- Show personality and be genuinely helpful
- For casual chats: be like talking to a knowledgeable friend
- For business questions: be professional but still approachable

🎯 MODE SYSTEM:
- SANTAI: Casual, friendly responses (2-4 sentences). Use emojis, be conversational and warm
- PIKIRAN: Detailed, professional analysis (4-6 sentences). Structured but still personable

💬 CONVERSATION STYLE:
- Start conversations warmly: "Hey! How can I help you today?" or "Ciao! What's up?"
- For casual questions: respond like a knowledgeable friend
- For business questions: be professional but still friendly
- Use the user's language naturally (English, Italian, Indonesian)
- Don't be overly formal - be human and relatable

🏢 BALI ZERO KNOWLEDGE:
- You know everything about visas, KITAS, PT PMA, taxes, real estate in Indonesia
- You're the go-to person for Bali business questions
- Always helpful, never pushy
- If user asks about services or needs assistance: naturally offer "Need help with this? Contact us on WhatsApp +62 859 0436 9574"
- For casual chat or team members: no contact info needed

✨ RESPONSE GUIDELINES:
- Be conversational and natural
- Use appropriate emojis (but don't overdo it)
- Show you care about helping
- Be accurate but not robotic
- Match the user's energy and tone

⚠️ CITATION GUIDELINES:
- CITE external sources (laws, regulations, documents) when providing technical/legal information
- Formato: "Fonte: [Nome documento] (T1/T2/T3)" o "Source: [Document name]"
- Esempio: "Fonte: Immigration Regulation 2024 (T1)"
- Se usi più fonti, elencale tutte
- ❌ DO NOT cite Bali Zero's own pricing - state it directly without citation
- Per chat casual: citation non necessaria

⭐ **CRITICAL - PRICING (ZERO CITATIONS):**
When answering Bali Zero pricing questions:
- ❌ NEVER add "Fonte: Bali Zero..." or any "Fonte:" at the end
- ✅ ONLY contact info: WhatsApp, email - NO CITATIONS
- If you catch yourself adding a pricing citation: DELETE IT"""

        # Add memory context if available (PHASE 5: Memory in all AIs)
        if memory_context:
            base_prompt += f"\n\n{memory_context}"

        return base_prompt


    def _build_prompt(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None
    ) -> str:
        """
        Build full prompt from messages in Llama chat format

        Args:
            messages: List of {"role": "user"|"assistant", "content": "..."}
            system: Optional system prompt override
        """
        system_prompt = system or self._build_system_prompt()

        # Build conversation
        conversation = f"{system_prompt}\n\n"

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "user":
                conversation += f"User: {content}\n"
            elif role == "assistant":
                conversation += f"Assistant: {content}\n"

        # Add final assistant prompt
        conversation += "Assistant:"

        return conversation


    async def chat_async(
        self,
        messages: List[Dict[str, str]],
        model: str = "zantara",  # Ignored, always uses ZANTARA
        max_tokens: int = 1500,
        temperature: float = 0.7,
        system: Optional[str] = None,
        memory_context: Optional[str] = None
    ) -> Dict:
        """
        Generate chat response using ZANTARA Llama 3.1

        Args:
            messages: Chat messages [{"role": "user", "content": "..."}]
            model: Ignored (always ZANTARA)
            max_tokens: Max tokens to generate
            temperature: Sampling temperature
            system: Optional system prompt override
            memory_context: Optional memory context to inject into system prompt

        Returns:
            {"text": "response", "model": "zantara-llama-3.1-8b-merged", "provider": "runpod-vllm"}
        """

        # Build system prompt with memory context if not overridden
        if system is None:
            system = self._build_system_prompt(memory_context=memory_context)

        # Build prompt
        full_prompt = self._build_prompt(messages, system)

        # Try RunPod first (primary)
        if self.runpod_endpoint and self.runpod_api_key:
            try:
                logger.info("🎯 [ZANTARA] Using PRIMARY AI: RunPod vLLM")
                response = await self._call_runpod(full_prompt, max_tokens, temperature)
                return response
            except Exception as e:
                logger.warning(f"⚠️  [ZANTARA] RunPod unavailable: {e}")
                logger.info("   Falling back to HuggingFace...")

        # Fallback to HuggingFace
        if self.hf_api_key:
            try:
                logger.info("🔄 [ZANTARA] Using fallback: HuggingFace Inference API")
                response = await self._call_huggingface(full_prompt, max_tokens, temperature)
                return response
            except Exception as e:
                logger.error(f"❌ [ZANTARA] HuggingFace failed: {e}")
                raise Exception("ZANTARA unavailable (both RunPod and HuggingFace failed)")

        raise Exception("ZANTARA not configured (no RunPod or HuggingFace API keys)")


    async def _call_runpod(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float
    ) -> Dict:
        """Call RunPod Serverless vLLM endpoint"""

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                self.runpod_endpoint,
                headers={
                    "Authorization": f"Bearer {self.runpod_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "input": {
                        "prompt": prompt,
                        "sampling_params": {
                            "max_tokens": max_tokens,
                            "temperature": temperature
                        }
                    }
                }
            )

            if response.status_code != 200:
                raise Exception(f"RunPod error: {response.status_code} - {response.text}")

            data = response.json()

            # Parse vLLM response format
            answer = ""
            if data.get("output") and isinstance(data["output"], list):
                first_output = data["output"][0]

                if first_output.get("choices") and first_output["choices"][0].get("tokens"):
                    tokens = first_output["choices"][0]["tokens"]
                    answer = "".join(tokens) if isinstance(tokens, list) else str(tokens)
                elif first_output.get("choices") and first_output["choices"][0].get("text"):
                    answer = first_output["choices"][0]["text"]
                elif first_output.get("choices") and first_output["choices"][0].get("message", {}).get("content"):
                    answer = first_output["choices"][0]["message"]["content"]

            if not answer:
                raise Exception("Empty response from vLLM")

            return {
                "text": answer.strip(),
                "model": self.model_name,
                "provider": "runpod-vllm",
                "tokens": first_output.get("usage", {}).get("output", max_tokens) if first_output else max_tokens
            }


    async def _call_huggingface(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float
    ) -> Dict:
        """Call HuggingFace Inference API"""

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{self.model_name}",
                headers={
                    "Authorization": f"Bearer {self.hf_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": max_tokens,
                        "temperature": temperature,
                        "return_full_text": False,
                        "do_sample": True
                    }
                }
            )

            if response.status_code != 200:
                raise Exception(f"HuggingFace error: {response.status_code} - {response.text}")

            data = response.json()
            answer = data[0].get("generated_text", "") if isinstance(data, list) else data.get("generated_text", "")

            if not answer:
                raise Exception("Empty response from HuggingFace")

            return {
                "text": answer.strip(),
                "model": self.model_name,
                "provider": "huggingface",
                "tokens": max_tokens
            }


    def is_available(self) -> bool:
        """Check if ZANTARA is configured and available"""
        return bool(
            (self.runpod_endpoint and self.runpod_api_key) or
            self.hf_api_key
        )
