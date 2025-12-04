from collections.abc import AsyncGenerator

import google.generativeai as genai
from prompts.jaksel_persona import FEW_SHOT_EXAMPLES, SYSTEM_INSTRUCTION

from app.core.config import settings

# Configure API Key
if settings.google_api_key:
    genai.configure(api_key=settings.google_api_key)


class GeminiJakselService:
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        """
        Initialize Gemini Service with Jaksel Persona

        Args:
            model_name: "gemini-2.5-flash" (Fast/Unlimited on Ultra) or "gemini-2.5-pro" (High Quality)

        Note:
            - Free tier: 2.5 Flash (250 RPD), 2.5 Pro (100 RPD)
            - Ultra plan: Both unlimited for normal use
            - Old models (1.5-flash, 1.5-pro) are deprecated and no longer available
        """
        self.model_name = model_name

        # Construct the full system prompt with examples
        # We inject examples into the system instruction or as history
        # For Gemini, best practice is to put them in the system instruction or history.
        # Here we append them to the system instruction for simplicity and strong adherence.

        # Combine System Instruction
        # Examples are injected via history (see below), so we keep system instruction clean
        self.system_instruction = SYSTEM_INSTRUCTION

        self.model = genai.GenerativeModel(
            model_name=self.model_name, system_instruction=self.system_instruction
        )

        # Pre-compute history from examples for "Few-Shot" prompting
        # This is the "Chat History" approach which is often better for style transfer
        self.few_shot_history = []
        for ex in FEW_SHOT_EXAMPLES:
            role = "user" if ex["role"] == "user" else "model"
            self.few_shot_history.append({"role": role, "parts": [ex["content"]]})

    async def generate_response_stream(
        self, message: str, history: list[dict] | None = None, context: str = ""
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response in Jaksel style

        Args:
            message: Current user message
            history: Conversation history (excluding few-shot)
            context: RAG context / documents to ground the answer

        Yields:
            Chunks of text
        """
        # Combine few-shot history with actual conversation history
        chat_history = self.few_shot_history.copy()

        # Convert app history format to Gemini format
        if history is None:
            history = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            chat_history.append({"role": role, "parts": [msg["content"]]})

        chat = self.model.start_chat(history=chat_history)

        # Inject Context if available
        final_message = message
        if context:
            final_message = f"CONTEXT (Use this data):\n{context}\n\nUSER QUERY:\n{message}"

        response = await chat.send_message_async(final_message, stream=True)

        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def generate_response(
        self, message: str, history: list[dict] | None = None, context: str = ""
    ) -> str:
        """
        Generate full response (non-streaming)
        """
        full_response = ""
        async for chunk in self.generate_response_stream(message, history, context):
            full_response += chunk
        return full_response


# Singleton instance
gemini_jaksel = GeminiJakselService()

if __name__ == "__main__":
    import asyncio

    async def test():
        print("🚀 Testing Gemini Jaksel Service...")

        # Test Query
        query = "Bro, gue mau bikin PT PMA tapi modal gue pas-pasan. Ada solusi gak?"
        print(f"\nUser: {query}")
        print("Assistant: ", end="", flush=True)

        async for chunk in gemini_jaksel.generate_response_stream(query):
            print(chunk, end="", flush=True)
        print("\n")

    if not settings.google_api_key:
        print("❌ GOOGLE_API_KEY not set in settings/env")
    else:
        asyncio.run(test())
