"""
Unified AI Analyzer
Supports Gemini, Claude, LLAMA with automatic fallback
"""

import json
import os
from typing import Optional, Dict, Any, List
from loguru import logger

from ..models.ai_analysis import AIAnalysisResult, ImpactLevel, Urgency


class AIProvider:
    """Base class for AI providers"""

    def analyze(self, content: str, prompt: str) -> Optional[Dict[str, Any]]:
        """Analyze content with AI"""
        raise NotImplementedError


class GeminiProvider(AIProvider):
    """Google Gemini provider"""

    def __init__(self, api_key: Optional[str], model: str = "gemini-2.0-flash-exp"):
        self.api_key = api_key
        self.model = model
        self._client = None

    def _ensure_client(self):
        if self._client or not self.api_key:
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._client = genai.GenerativeModel(self.model)
            logger.debug(f"Gemini client initialized ({self.model})")
        except Exception as e:
            logger.warning(f"Gemini initialization failed: {e}")

    def analyze(self, content: str, prompt: str) -> Optional[Dict[str, Any]]:
        self._ensure_client()

        if not self._client:
            return None

        try:
            full_prompt = f"{prompt}\n\nContent: {content[:2000]}"
            response = self._client.generate_content(full_prompt)
            text = response.text.strip()

            # Clean markdown code blocks
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)
            result["ai_provider"] = "gemini"
            result["model_used"] = self.model
            return result

        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return None


class ClaudeProvider(AIProvider):
    """Anthropic Claude provider"""

    def __init__(self, api_key: Optional[str], model: str = "claude-3-haiku-20240307"):
        self.api_key = api_key
        self.model = model
        self._client = None

    def _ensure_client(self):
        if self._client or not self.api_key:
            return

        try:
            from anthropic import Anthropic
            self._client = Anthropic(api_key=self.api_key)
            logger.debug(f"Claude client initialized ({self.model})")
        except Exception as e:
            logger.warning(f"Claude initialization failed: {e}")

    def analyze(self, content: str, prompt: str) -> Optional[Dict[str, Any]]:
        self._ensure_client()

        if not self._client:
            return None

        try:
            full_prompt = f"{prompt}\n\nContent: {content[:2000]}"

            message = self._client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": full_prompt}]
            )

            text = message.content[0].text.strip()

            # Clean markdown
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)
            result["ai_provider"] = "claude"
            result["model_used"] = self.model
            return result

        except Exception as e:
            logger.error(f"Claude analysis failed: {e}")
            return None


class LLAMAProvider(AIProvider):
    """Ollama LLAMA provider (local)"""

    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "llama3.2"):
        self.ollama_url = ollama_url
        self.model = model

    def analyze(self, content: str, prompt: str) -> Optional[Dict[str, Any]]:
        try:
            import requests

            full_prompt = f"{prompt}\n\nContent: {content[:2000]}"

            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": full_prompt,
                    "stream": False
                },
                timeout=60
            )

            if response.status_code != 200:
                return None

            text = response.json().get("response", "").strip()

            # Clean markdown
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)
            result["ai_provider"] = "llama"
            result["model_used"] = self.model
            return result

        except Exception as e:
            logger.error(f"LLAMA analysis failed: {e}")
            return None


class AIAnalyzer:
    """
    Unified AI analyzer with automatic provider fallback
    Tries providers in order until one succeeds
    """

    def __init__(
        self,
        gemini_key: Optional[str] = None,
        anthropic_key: Optional[str] = None,
        ollama_url: str = "http://localhost:11434",
        provider_order: List[str] = None
    ):
        """
        Initialize AI Analyzer

        Args:
            gemini_key: Gemini API key
            anthropic_key: Anthropic API key
            ollama_url: Ollama API URL
            provider_order: Order of providers to try
        """
        self.provider_order = provider_order or ["gemini", "claude", "llama"]

        # Initialize providers
        self.providers = {
            "gemini": GeminiProvider(gemini_key or os.getenv("GEMINI_API_KEY")),
            "claude": ClaudeProvider(anthropic_key or os.getenv("ANTHROPIC_API_KEY")),
            "llama": LLAMAProvider(ollama_url)
        }

    def analyze(
        self,
        content: str,
        prompt_template: str,
        fallback_on_error: bool = True
    ) -> Optional[AIAnalysisResult]:
        """
        Analyze content with AI (tries providers in order)

        Args:
            content: Content to analyze
            prompt_template: Prompt template
            fallback_on_error: Try next provider on error

        Returns:
            AIAnalysisResult or None
        """

        for provider_name in self.provider_order:
            provider = self.providers.get(provider_name)

            if not provider:
                continue

            logger.debug(f"Trying AI provider: {provider_name}")

            try:
                result_dict = provider.analyze(content, prompt_template)

                if result_dict:
                    logger.info(f"AI analysis successful: {provider_name}")
                    return self._dict_to_model(result_dict)

            except Exception as e:
                logger.warning(f"Provider {provider_name} failed: {e}")

            if not fallback_on_error:
                break

        logger.warning("All AI providers failed")
        return None

    def _dict_to_model(self, data: Dict[str, Any]) -> AIAnalysisResult:
        """Convert dictionary to AIAnalysisResult model"""

        # Map impact level
        impact_str = data.get("impact_level", "low").lower()
        impact_map = {
            "critical": ImpactLevel.CRITICAL,
            "high": ImpactLevel.HIGH,
            "medium": ImpactLevel.MEDIUM,
            "low": ImpactLevel.LOW
        }
        impact = impact_map.get(impact_str, ImpactLevel.LOW)

        # Map urgency
        urgency_str = data.get("urgency", "none").lower()
        urgency_map = {
            "immediate": Urgency.IMMEDIATE,
            "soon": Urgency.SOON,
            "future": Urgency.FUTURE,
            "none": Urgency.NONE
        }
        urgency = urgency_map.get(urgency_str, Urgency.NONE)

        return AIAnalysisResult(
            summary_id=data.get("summary_id"),
            summary_en=data.get("summary_en"),
            topics=data.get("topics", []),
            categories=data.get("categories", []),
            entities=data.get("entities", []),
            impact_level=impact,
            urgency=urgency,
            affected_groups=data.get("affected_groups", []),
            key_dates=data.get("key_dates", []),
            requirements=data.get("requirements", []),
            amounts=data.get("amounts", []),
            deadlines=data.get("deadlines", []),
            quality_score=data.get("quality_score", 0.0),
            relevance_score=data.get("relevance_score", 0.0),
            confidence=data.get("confidence", 0.5),
            ai_provider=data.get("ai_provider", "unknown"),
            model_used=data.get("model_used"),
            raw_response=data
        )

    def get_default_prompt(self, category: str) -> str:
        """Get default analysis prompt for category"""

        prompts = {
            "immigration": """Analyze this Indonesian immigration/visa content and extract structured information.

Extract as JSON:
{
  "summary_id": "1-2 sentence summary in Indonesian",
  "summary_en": "1-2 sentence summary in English",
  "topics": ["list of visa types mentioned"],
  "categories": ["regulation", "procedure", "requirement", etc],
  "impact_level": "critical|high|medium|low",
  "urgency": "immediate|soon|future|none",
  "affected_groups": ["workers", "investors", "tourists", etc],
  "requirements": ["list of requirements"],
  "key_dates": ["important dates"],
  "deadlines": ["deadlines mentioned"],
  "confidence": 0.0-1.0
}

Output ONLY valid JSON, no other text.""",

            "tax": """Analyze this Indonesian tax content and extract structured information.

Extract as JSON:
{
  "summary_id": "1-2 sentence summary in Indonesian",
  "summary_en": "1-2 sentence summary in English",
  "topics": ["tax types mentioned"],
  "categories": ["regulation", "deadline", "rate_change", etc],
  "impact_level": "critical|high|medium|low",
  "urgency": "immediate|soon|future|none",
  "affected_groups": ["PT", "PT PMA", "Small Business", "Individual"],
  "requirements": ["requirements or changes"],
  "amounts": [{"type": "rate", "value": "22%"}],
  "deadlines": ["deadline dates"],
  "confidence": 0.0-1.0
}

Output ONLY valid JSON, no other text.""",

            "property": """Analyze this Indonesian property content and extract structured information.

Extract as JSON:
{
  "summary_id": "1-2 sentence summary in Indonesian",
  "summary_en": "1-2 sentence summary in English",
  "topics": ["property types, locations"],
  "categories": ["listing", "regulation", "market_update"],
  "impact_level": "critical|high|medium|low",
  "urgency": "immediate|soon|future|none",
  "affected_groups": ["investors", "expats", "developers"],
  "requirements": ["legal requirements"],
  "amounts": [{"type": "price", "value": "1000000000"}],
  "confidence": 0.0-1.0
}

Output ONLY valid JSON, no other text.""",

            "news": """Analyze this news content and extract structured information.

Extract as JSON:
{
  "summary_id": "1-2 sentence summary in Indonesian",
  "summary_en": "1-2 sentence summary in English",
  "topics": ["main topics"],
  "categories": ["politics", "economy", "regulation", etc],
  "impact_level": "critical|high|medium|low",
  "urgency": "immediate|soon|future|none",
  "affected_groups": ["affected groups"],
  "confidence": 0.0-1.0
}

Output ONLY valid JSON, no other text."""
        }

        return prompts.get(category, prompts["news"])
