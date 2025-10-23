"""
Unified AI Analyzer
Supports LLAMA (local Ollama) and Zantara with automatic fallback
"""

import json
import os
import requests
from typing import Optional, Dict, Any, List
from loguru import logger

from ..models.ai_analysis import AIAnalysisResult, ImpactLevel, Urgency


class AIProvider:
    """Base class for AI providers"""

    def analyze(self, content: str, prompt: str) -> Optional[Dict[str, Any]]:
        """Analyze content with AI"""
        raise NotImplementedError


class LLAMAProvider(AIProvider):
    """Ollama LLAMA provider (local)"""

    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "llama3.2"):
        self.ollama_url = ollama_url
        self.model = model

    def analyze(self, content: str, prompt: str) -> Optional[Dict[str, Any]]:
        try:
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
                logger.error(f"LLAMA error: HTTP {response.status_code}")
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

        except requests.exceptions.RequestException as e:
            logger.error(f"LLAMA connection error: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"LLAMA JSON parse error: {e}")
            return None
        except Exception as e:
            logger.error(f"LLAMA analysis failed: {e}")
            return None


class ZantaraProvider(AIProvider):
    """
    Zantara/LLAMA provider via backend API
    Uses the existing Zantara backend when commanded
    """

    def __init__(self, zantara_url: str = "http://localhost:8000", api_key: Optional[str] = None):
        self.zantara_url = zantara_url
        self.api_key = api_key or os.getenv("ZANTARA_API_KEY")

    def analyze(self, content: str, prompt: str) -> Optional[Dict[str, Any]]:
        try:
            full_prompt = f"{prompt}\n\nContent: {content[:2000]}"

            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            # Call Zantara API endpoint for analysis
            response = requests.post(
                f"{self.zantara_url}/api/analyze",
                json={
                    "content": full_prompt,
                    "mode": "structured_extraction"
                },
                headers=headers,
                timeout=60
            )

            if response.status_code != 200:
                logger.error(f"Zantara error: HTTP {response.status_code}")
                return None

            data = response.json()

            # Extract structured result from Zantara response
            if "result" in data:
                result = data["result"]
            elif "analysis" in data:
                result = data["analysis"]
            else:
                result = data

            result["ai_provider"] = "zantara"
            result["model_used"] = "zantara-llama"
            return result

        except requests.exceptions.RequestException as e:
            logger.error(f"Zantara connection error: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Zantara JSON parse error: {e}")
            return None
        except Exception as e:
            logger.error(f"Zantara analysis failed: {e}")
            return None


class AIAnalyzer:
    """
    Unified AI analyzer with LLAMA and Zantara support
    Automatically falls back: Zantara → Local LLAMA
    """

    def __init__(
        self,
        ollama_url: str = "http://localhost:11434",
        llama_model: str = "llama3.2",
        zantara_url: str = "http://localhost:8000",
        zantara_api_key: Optional[str] = None,
        provider_order: List[str] = None
    ):
        """
        Initialize AI Analyzer with LLAMA providers

        Args:
            ollama_url: Ollama API URL for local LLAMA
            llama_model: LLAMA model name
            zantara_url: Zantara backend URL
            zantara_api_key: API key for Zantara (optional)
            provider_order: Order to try providers ["zantara", "llama"]
        """
        self.provider_order = provider_order or ["zantara", "llama"]

        # Initialize providers
        self.providers = {
            "llama": LLAMAProvider(ollama_url, llama_model),
            "zantara": ZantaraProvider(zantara_url, zantara_api_key)
        }

        logger.info(f"AIAnalyzer initialized with providers: {self.provider_order}")

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

    def set_provider_order(self, order: List[str]):
        """
        Change provider order at runtime

        Args:
            order: New provider order e.g. ["llama", "zantara"]
        """
        valid_providers = [p for p in order if p in self.providers]
        if not valid_providers:
            raise ValueError(f"No valid providers in order: {order}")

        self.provider_order = valid_providers
        logger.info(f"Provider order changed to: {self.provider_order}")
