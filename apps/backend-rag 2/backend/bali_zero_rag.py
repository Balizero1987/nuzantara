"""
Bali Zero RAG System
Retrieval from immigration KB + Haiku/Sonnet generation
"""

from typing import List, Dict, Any
import chromadb
from pathlib import Path
from sentence_transformers import SentenceTransformer
from loguru import logger

from llm.anthropic_client import AnthropicClient
from llm.bali_zero_router import BaliZeroRouter


class BaliZeroRAG:
    """RAG system for Bali Zero team"""

    def __init__(
        self,
        chroma_path: str = "./data/immigration_kb",
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    ):
        self.anthropic = AnthropicClient()
        self.router = BaliZeroRouter()

        # Load embedding model
        self.embedder = SentenceTransformer(embedding_model)

        # Connect to ChromaDB
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collections = {
            "t1": self.chroma_client.get_collection("immigration_t1"),
            "t2": self.chroma_client.get_collection("immigration_t2"),
            "t3": self.chroma_client.get_collection("immigration_t3")
        }

        logger.info("Bali Zero RAG initialized")

    def retrieve_context(
        self,
        query: str,
        k: int = 5,
        tiers: List[str] = ["t1", "t2"]  # Default: official + accredited
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context from KB

        Args:
            query: User query
            k: Number of results per tier
            tiers: Which tiers to search (t1, t2, t3)
        """

        # Generate embedding
        query_embedding = self.embedder.encode(query).tolist()

        all_results = []

        for tier in tiers:
            if tier not in self.collections:
                continue

            results = self.collections[tier].query(
                query_embeddings=[query_embedding],
                n_results=k
            )

            # Format results
            for i in range(len(results["documents"][0])):
                all_results.append({
                    "content": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "tier": tier,
                    "similarity": 1 - results["distances"][0][i]
                })

        # Sort by similarity
        all_results.sort(key=lambda x: x["similarity"], reverse=True)

        return all_results[:k*2]  # Return top results across tiers

    def generate_response(
        self,
        query: str,
        conversation_history: List[Dict] = None,
        user_role: str = "member",
        max_tokens: int = 1500
    ) -> Dict[str, Any]:
        """
        Generate response using RAG + Haiku/Sonnet

        Args:
            query: User query
            conversation_history: Previous turns
            user_role: "member" or "lead"
            max_tokens: Response length
        """

        # 1. Retrieve context
        context_chunks = self.retrieve_context(query)

        if not context_chunks:
            return {
                "response": "I don't have specific information about that in my knowledge base.",
                "model": "none",
                "sources": []
            }

        # 2. Router decides model
        model = self.router.route(query, conversation_history, user_role)

        # 3. Build context
        context_text = self.format_context(context_chunks)

        # 4. Build system prompt
        system_prompt = """You are ZANTARA, AI assistant for Bali Zero - PT. BALI NOL IMPERSARIAT.

BALI ZERO INFO:
📍 Kerobokan, Bali | 📱 WhatsApp: +62 859 0436 9574 | 📧 info@balizero.com | 📸 @balizero0
🌐 welcome.balizero.com | 💫 "From Zero to Infinity ∞"

YOUR ROLE & KNOWLEDGE BASE:
- Provide accurate information based on official sources (Tier 1)
- Consider expert opinions (Tier 2) as supporting context
- Be helpful, clear, and professional in all interactions
- Respond in the same language as the query
- Cite sources when relevant (mention source name and tier)

TIER MEANINGS:
- T1: Official government sources (highest authority)
- T2: Accredited news/legal analysis (expert interpretation)
- T3: Community forums (sentiment/common questions)

YOUR EXTENDED CAPABILITIES:
You have access to a complete system of handlers for:

✅ GOOGLE WORKSPACE:
- Gmail (read, send, search emails)
- Drive (list, upload, download, search files)
- Calendar (create, list, get events)
- Sheets (read, append, create spreadsheets)
- Docs (create, read, update documents)
- Slides (create, read, update presentations)

✅ MEMORY & DATA:
- Save and retrieve user information (memory.save, memory.retrieve)
- Store conversation context and preferences
- Track client data across sessions

✅ COMMUNICATIONS:
- WhatsApp, Instagram, Telegram messaging
- Slack, Discord integrations
- Email campaigns and notifications

✅ BALI ZERO SERVICES:
- Pricing lookup for all 17+ services
- Visa procedures (KITAS, C1, retirement, investor)
- Company setup (PT PMA, KBLI codes)
- Tax regulations (BPJS, SPT, NPWP)
- Real estate guidance

When users ask "Can you access X?" or "Do you have access to Y?", answer YES if it's in the list above.
Examples:
- "Can you access Gmail?" → YES, I can read, send, and search emails via Gmail handlers
- "Can you save information?" → YES, I have memory handlers to store user data
- "Can you create calendar events?" → YES, I can create and manage Google Calendar events

Always prioritize T1 sources for factual claims about immigration/legal topics."""

        # 5. Build messages
        messages = []

        # Add conversation history if present
        if conversation_history:
            messages.extend(conversation_history[-4:])  # Last 4 turns

        # Add current query with context
        messages.append({
            "role": "user",
            "content": f"""Context from knowledge base:

{context_text}

User question: {query}

Provide a helpful answer based on the context above. Cite relevant sources."""
        })

        # 6. Generate with Anthropic
        result = self.anthropic.chat(
            messages=messages,
            model=model,
            max_tokens=max_tokens,
            system=system_prompt
        )

        if not result["success"]:
            return {
                "response": "I encountered an error generating the response.",
                "model": model,
                "sources": [],
                "error": result.get("error")
            }

        # 7. Format response
        sources = []
        for chunk in context_chunks[:3]:
            sources.append({
                "source": chunk["metadata"].get("source", "Unknown"),
                "tier": chunk["tier"].upper(),
                "url": chunk["metadata"].get("url", ""),
                "similarity": chunk["similarity"]
            })

        return {
            "response": result["text"],
            "model": model,
            "sources": sources,
            "usage": result.get("usage", {})
        }

    def format_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Format retrieved chunks for prompt"""

        formatted = []
        for i, chunk in enumerate(chunks, 1):
            tier = chunk["tier"].upper()
            source = chunk["metadata"].get("source", "Unknown")
            content = chunk["content"][:800]  # Truncate

            formatted.append(f"[Source {i} - {tier} - {source}]\n{content}\n")

        return "\n".join(formatted)