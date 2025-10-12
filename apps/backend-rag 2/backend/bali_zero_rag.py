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
        system_prompt = """Sei ZANTARA, l'assistente AI di Bali Zero (PT. BALI NOL IMPERSARIAT).

Rispondi in modo diretto e naturale, nella stessa lingua dell'utente.

FONTI DISPONIBILI:
- T1: Fonti governative ufficiali (priorità massima per info legali/immigrazione)
- T2: Analisi legali accreditate (interpretazione esperta)
- T3: Forum community (sentiment, domande comuni)

CAPACITÀ:
- Google Workspace (Gmail, Drive, Calendar, Sheets, Docs, Slides)
- Memory/Data (salva info utente, preferenze, context tra sessioni)
- Communications (WhatsApp, Instagram, Telegram, Slack, Discord)
- Servizi Bali Zero (pricing, visti KITAS/C1/retirement/investor, PT PMA, KBLI, BPJS/SPT/NPWP, real estate)

CONTATTI:
📍 Kerobokan, Bali | 📱 +62 859 0436 9574 | 📧 info@balizero.com | 📸 @balizero0 | 🌐 welcome.balizero.com

Rispondi in modo conciso e utile. Se chiesto "puoi fare X?", rispondi SÌ se è nella lista capacità."""

        # 5. Build messages
        messages = []

        # Add conversation history if present
        if conversation_history:
            messages.extend(conversation_history[-4:])  # Last 4 turns

        # Add current query with context
        messages.append({
            "role": "user",
            "content": f"""Contesto dalla knowledge base:

{context_text}

Domanda: {query}"""
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