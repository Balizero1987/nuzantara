"""
ZANTARA - RAG Generator
Complete RAG pipeline: Search + Context + LLM Generation
"""

import logging
from typing import Dict, Any, List, Optional
from .ollama_client import OllamaClient
from .search_service import SearchService

logger = logging.getLogger(__name__)


class RAGGenerator:
    """
    Complete RAG (Retrieval-Augmented Generation) pipeline.

    Flow:
    1. Semantic search → get relevant chunks
    2. Build context from top results
    3. Generate answer using LLM + context
    """

    # Default system prompt for RAG
    DEFAULT_SYSTEM_PROMPT = """You are ZANTARA, an intelligent assistant with access to a knowledge base of 214 books covering esotericism, Indonesian magic, philosophy, and more.

Your task:
- Answer questions using ONLY the provided context from the knowledge base
- If the context doesn't contain the answer, say "I don't have enough information in my knowledge base to answer this."
- Be concise but complete
- Cite book titles when possible
- Maintain a helpful, knowledgeable tone

Context will be provided below. Use it to answer the user's question."""

    def __init__(
        self,
        ollama_base_url: str = "http://localhost:11434",
        ollama_model: str = "llama3.2",
        max_context_chunks: int = 5
    ):
        """
        Initialize RAG generator.

        Args:
            ollama_base_url: Ollama server URL
            ollama_model: LLM model to use
            max_context_chunks: Max chunks to include in context (default: 5)
        """
        self.ollama = OllamaClient(
            base_url=ollama_base_url,
            default_model=ollama_model
        )
        self.search_service = SearchService()
        self.max_context_chunks = max_context_chunks
        logger.info(f"RAGGenerator initialized with model: {ollama_model}")

    async def close(self):
        """Close all clients"""
        await self.ollama.close()

    async def generate_answer(
        self,
        query: str,
        user_level: int = 3,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate answer using RAG pipeline.

        Args:
            query: User's question
            user_level: Access level (0-3) for search filtering
            temperature: LLM sampling temperature
            system_prompt: Optional custom system prompt

        Returns:
            Dict with:
                - answer: Generated answer text
                - sources: List of source chunks used
                - model: LLM model used
                - query: Original query
                - execution_time_ms: Total time
        """
        import time
        start_time = time.time()

        try:
            # Step 1: Semantic search
            logger.info(f"RAG Query: '{query}' (level {user_level})")
            search_results = await self.search_service.search(
                query=query,
                user_level=user_level,
                limit=self.max_context_chunks
            )

            # Step 2: Build context
            context = self._build_context(search_results["results"])

            if not context:
                return {
                    "answer": "I don't have enough information in my knowledge base to answer this question.",
                    "sources": [],
                    "model": self.ollama.default_model,
                    "query": query,
                    "execution_time_ms": (time.time() - start_time) * 1000
                }

            # Step 3: Build prompt
            final_prompt = self._build_prompt(query, context)

            # Step 4: Generate with LLM
            system = system_prompt or self.DEFAULT_SYSTEM_PROMPT
            answer = await self.ollama.generate(
                prompt=final_prompt,
                system=system,
                temperature=temperature
            )

            execution_time = (time.time() - start_time) * 1000

            logger.info(
                f"RAG completed: '{query}' -> {len(answer)} chars in {execution_time:.2f}ms"
            )

            # Step 5: Format response
            return {
                "answer": answer,
                "sources": self._format_sources(search_results["results"]),
                "model": self.ollama.default_model,
                "query": query,
                "execution_time_ms": round(execution_time, 2)
            }

        except Exception as e:
            logger.error(f"RAG generation failed: {e}")
            return {
                "answer": f"Error generating answer: {str(e)}",
                "sources": [],
                "model": self.ollama.default_model,
                "query": query,
                "error": str(e),
                "execution_time_ms": (time.time() - start_time) * 1000
            }

    def _build_context(self, search_results: Dict[str, Any]) -> str:
        """
        Build context string from search results.

        Args:
            search_results: Raw search results from vector DB

        Returns:
            Formatted context string
        """
        if not search_results.get("documents"):
            return ""

        context_parts = []

        for idx, doc in enumerate(search_results["documents"][:self.max_context_chunks], 1):
            metadata = search_results["metadatas"][idx - 1]
            book_title = metadata.get("book_title", "Unknown")
            author = metadata.get("book_author", "Unknown")

            context_parts.append(
                f"[Source {idx}] {book_title} by {author}\n{doc}\n"
            )

        return "\n---\n".join(context_parts)

    def _build_prompt(self, query: str, context: str) -> str:
        """
        Build final prompt with query + context.

        Args:
            query: User's question
            context: Retrieved context

        Returns:
            Complete prompt string
        """
        return f"""Context from knowledge base:

{context}

---

Question: {query}

Answer:"""

    def _format_sources(self, search_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Format search results into source citations.

        Args:
            search_results: Raw search results

        Returns:
            List of source dicts
        """
        if not search_results.get("documents"):
            return []

        sources = []

        for idx, doc in enumerate(search_results["documents"], 1):
            metadata = search_results["metadatas"][idx - 1]
            distance = search_results["distances"][idx - 1]

            sources.append({
                "index": idx,
                "book_title": metadata.get("book_title", "Unknown"),
                "book_author": metadata.get("book_author", "Unknown"),
                "tier": metadata.get("tier", "C"),
                "chunk_text": doc[:200] + "..." if len(doc) > 200 else doc,
                "similarity_score": round(1 / (1 + distance), 4)
            })

        return sources

    async def health_check(self) -> Dict[str, Any]:
        """
        Check health of RAG system.

        Returns:
            Health status dict
        """
        ollama_health = await self.ollama.health_check()

        return {
            "status": "operational" if ollama_health["status"] == "operational" else "degraded",
            "llm": ollama_health,
            "search": "ready",
            "model": self.ollama.default_model
        }


# Example usage
if __name__ == "__main__":
    import asyncio

    async def test_rag():
        """Test RAG generator"""
        rag = RAGGenerator()

        # Health check
        print("🏥 RAG Health Check:")
        health = await rag.health_check()
        print(f"   Status: {health.get('status')}")
        print(f"   Model: {health.get('model')}")

        # Test query
        print("\n🔮 Test RAG Query:")
        result = await rag.generate_answer(
            query="What is Sunda Wiwitan?",
            user_level=3,
            temperature=0.7
        )

        print(f"\n📝 Answer ({result['execution_time_ms']:.0f}ms):")
        print(result["answer"])

        print(f"\n📚 Sources ({len(result['sources'])}):")
        for source in result["sources"]:
            print(f"   [{source['index']}] {source['book_title']} (similarity: {source['similarity_score']})")

        await rag.close()

    asyncio.run(test_rag())