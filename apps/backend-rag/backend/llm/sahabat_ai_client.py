"""
SahabatAI Client - Natural Bahasa Indonesia Language Model
Developed by GoTo Group + Indosat for Indonesian language excellence
"""

from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import torch
from typing import Optional, Dict, List
import asyncio


class SahabatAIClient:
    """
    Client for SahabatAI-v1 Gemma2-9B Instruct model
    Optimized for natural, fluent Bahasa Indonesia

    Features:
    - Superior linguistic fluency in Indonesian
    - Recognizes regional slang and idioms
    - Supports Javanese, Sundanese dialects
    - 4-bit quantization for efficient deployment
    """

    def __init__(
        self,
        model_name: str = "GoToCompany/gemma2-9b-cpt-sahabatai-v1-instruct",
        use_4bit: bool = True,
        device: str = "auto"
    ):
        """
        Initialize SahabatAI client

        Args:
            model_name: Hugging Face model ID
            use_4bit: Use 4-bit quantization (reduces VRAM from ~18GB to ~6GB)
            device: "cuda", "cpu", or "auto"
        """
        self.model_name = model_name
        self.use_4bit = use_4bit

        print(f"🇮🇩 Loading SahabatAI: {model_name}")
        print(f"   Quantization: {'4-bit' if use_4bit else 'full precision'}")

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)

        # Load model with appropriate configuration
        if use_4bit:
            # 4-bit quantization config (requires bitsandbytes)
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )

            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=quantization_config,
                device_map=device,
                trust_remote_code=True
            )
        else:
            # Full precision (bf16)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.bfloat16,
                device_map=device,
                trust_remote_code=True
            )

        print(f"✅ SahabatAI loaded successfully on {self.model.device}")
        print(f"   Memory usage: ~{'6GB' if use_4bit else '18GB'} VRAM")

    async def chat_async(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
        top_p: float = 0.9
    ) -> Dict:
        """
        Generate response using SahabatAI

        Args:
            messages: List of {"role": "user/assistant/system", "content": "..."}
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

        # Generate in thread pool to not block event loop
        loop = asyncio.get_event_loop()
        outputs = await loop.run_in_executor(
            None,
            self._generate,
            inputs,
            max_tokens,
            temperature,
            top_p
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

    def _generate(self, inputs, max_tokens, temperature, top_p):
        """Generate in sync context for thread pool"""
        with torch.no_grad():
            return self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )

    def _format_chat_prompt(self, messages: List[Dict[str, str]]) -> str:
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
                # Gemma2 doesn't have explicit system role
                # Inject as first user message
                prompt = f"<start_of_turn>user\n{content}<end_of_turn>\n" + prompt

        # Add start of model turn for generation
        prompt += "<start_of_turn>model\n"

        return prompt

    def is_available(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None


# Test function
async def test_sahabat_ai():
    """Test SahabatAI with Indonesian queries"""

    print("\n" + "="*80)
    print("🇮🇩 TESTING SAHABATAI - NATURAL BAHASA INDONESIA")
    print("="*80 + "\n")

    # Initialize client
    client = SahabatAIClient(use_4bit=True)

    # Test queries
    test_queries = [
        {
            "system": "Kamu adalah asisten bisnis yang membantu orang asing dengan urusan bisnis di Indonesia. Gunakan bahasa Indonesia yang natural dan mudah dipahami.",
            "query": "Saya mau buka usaha kopi di Bali. KBLI apa yang cocok?"
        },
        {
            "system": "Kamu adalah asisten yang membantu dengan visa dan imigrasi Indonesia. Jawab dengan ramah dan jelas.",
            "query": "Berapa lama proses KITAS investor?"
        },
        {
            "system": "Kamu adalah konsultan pajak Indonesia. Jelaskan dengan bahasa yang mudah dipahami.",
            "query": "Apa bedanya PT dengan PT PMA?"
        }
    ]

    for i, test in enumerate(test_queries, 1):
        print(f"\n{'='*80}")
        print(f"Test {i}/{len(test_queries)}")
        print(f"{'='*80}")
        print(f"Query: {test['query']}\n")

        messages = [
            {"role": "system", "content": test["system"]},
            {"role": "user", "content": test["query"]}
        ]

        response = await client.chat_async(
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        print(f"Response:\n{response['text']}\n")
        print(f"Tokens: {response['tokens']['total']}")
        print(f"Model: {response['model']}")

    print("\n" + "="*80)
    print("✅ TESTING COMPLETE")
    print("="*80)
    print("\n👉 Next: Show responses to Indonesian team for naturalness evaluation")


if __name__ == "__main__":
    asyncio.run(test_sahabat_ai())
