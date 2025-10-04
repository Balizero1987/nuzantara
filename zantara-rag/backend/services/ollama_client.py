"""
ZANTARA - Ollama Client
Local LLM integration via Ollama API
Supports: Llama 3.2, Mistral, Phi-3, etc.
"""

import httpx
import logging
from typing import Dict, Any, Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class OllamaClient:
    """
    HTTP client for Ollama local LLM server
    Default: http://localhost:11434
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        default_model: str = "llama3.2",
        timeout: int = 120
    ):
        """
        Initialize Ollama client.

        Args:
            base_url: Ollama server URL (default: localhost:11434)
            default_model: Default model to use (default: llama3.2)
            timeout: Request timeout in seconds (default: 120)
        """
        self.base_url = base_url.rstrip('/')
        self.default_model = default_model
        self.timeout = timeout
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout
        )
        logger.info(f"OllamaClient initialized: {self.base_url} (model: {self.default_model})")

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> str:
        """
        Generate text using Ollama.

        Args:
            prompt: User prompt/question
            model: Model name (default: self.default_model)
            system: System prompt (optional)
            temperature: Sampling temperature (0-1)
            max_tokens: Max tokens to generate
            stream: Stream response (not implemented yet)

        Returns:
            Generated text response

        Raises:
            OllamaAPIError: If generation fails
        """
        model = model or self.default_model

        try:
            # Build request payload
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }

            if system:
                payload["system"] = system

            logger.debug(f"Generating with model '{model}': {prompt[:50]}...")

            # Call Ollama API
            response = await self.client.post(
                "/api/generate",
                json=payload
            )

            response.raise_for_status()
            data = response.json()

            # Extract generated text
            generated_text = data.get("response", "")

            if not generated_text:
                raise OllamaAPIError("Empty response from Ollama")

            logger.info(f"Generated {len(generated_text)} chars with {model}")
            return generated_text.strip()

        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama HTTP error: {e}")
            raise OllamaAPIError(f"HTTP {e.response.status_code}: {e}")

        except httpx.RequestError as e:
            logger.error(f"Ollama request error: {e}")
            raise OllamaAPIError(f"Request failed: {e}")

        except Exception as e:
            logger.error(f"Ollama unexpected error: {e}")
            raise OllamaAPIError(f"Generation failed: {e}")

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        Chat completion using Ollama chat API.

        Args:
            messages: List of message dicts with 'role' and 'content'
                      Example: [{"role": "user", "content": "Hello"}]
            model: Model name
            temperature: Sampling temperature
            max_tokens: Max tokens

        Returns:
            Assistant's response text
        """
        model = model or self.default_model

        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }

            response = await self.client.post(
                "/api/chat",
                json=payload
            )

            response.raise_for_status()
            data = response.json()

            # Extract message content
            message = data.get("message", {})
            content = message.get("content", "")

            if not content:
                raise OllamaAPIError("Empty chat response")

            logger.info(f"Chat response: {len(content)} chars")
            return content.strip()

        except Exception as e:
            logger.error(f"Chat error: {e}")
            raise OllamaAPIError(f"Chat failed: {e}")

    async def list_models(self) -> List[str]:
        """
        List available Ollama models.

        Returns:
            List of model names
        """
        try:
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            data = response.json()

            models = [model["name"] for model in data.get("models", [])]
            logger.info(f"Available models: {models}")
            return models

        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []

    async def health_check(self) -> Dict[str, Any]:
        """
        Check if Ollama server is running.

        Returns:
            Health status dict
        """
        try:
            response = await self.client.get("/")
            return {
                "status": "operational" if response.status_code == 200 else "degraded",
                "url": self.base_url,
                "model": self.default_model
            }
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return {
                "status": "unavailable",
                "error": str(e)
            }


class OllamaAPIError(Exception):
    """Exception for Ollama API errors"""
    pass


# Example usage
if __name__ == "__main__":
    import asyncio

    async def test_ollama():
        """Test Ollama client"""
        client = OllamaClient()

        # Health check
        print("🏥 Health Check:")
        health = await client.health_check()
        print(f"   Status: {health.get('status')}")

        # List models
        print("\n📦 Available Models:")
        models = await client.list_models()
        for model in models:
            print(f"   - {model}")

        # Test generation
        print("\n🤖 Test Generation:")
        try:
            response = await client.generate(
                prompt="What is 2+2? Answer in one sentence.",
                temperature=0.1
            )
            print(f"   Response: {response}")
        except Exception as e:
            print(f"   Error: {e}")

        await client.close()

    asyncio.run(test_ollama())