"""
Legal Document Chunker - Stage 4: The Butcher
Pasal-aware semantic chunking with context injection
"""

import logging
from typing import Any

from .constants import CONTEXT_TEMPLATE, MAX_PASAL_TOKENS, PASAL_PATTERN

logger = logging.getLogger(__name__)


class LegalChunker:
    """
    Semantic chunker for Indonesian legal documents.
    Uses Pasal-aware splitting with context injection.
    """

    def __init__(self, max_pasal_tokens: int = None):
        """
        Initialize legal chunker.

        Args:
            max_pasal_tokens: Maximum tokens per Pasal before splitting by Ayat
        """
        self.max_pasal_tokens = max_pasal_tokens or MAX_PASAL_TOKENS
        logger.info(f"LegalChunker initialized (max_pasal_tokens={self.max_pasal_tokens})")

    def chunk(
        self,
        text: str,
        metadata: dict[str, Any],
        structure: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Chunk legal document with Pasal-aware strategy and context injection.

        Args:
            text: Cleaned legal document text
            metadata: Document metadata (type, number, year, topic)
            structure: Parsed structure (optional, for better context)

        Returns:
            List of chunk dictionaries with injected context
        """
        if not text or not text.strip():
            logger.warning("Empty text provided to legal chunker")
            return []

        chunks = []

        # Strategy: Split by Pasal first
        pasal_chunks = self._split_by_pasal(text)

        for pasal_chunk in pasal_chunks:
            # Extract Pasal number
            pasal_match = PASAL_PATTERN.match(pasal_chunk)
            if not pasal_match:
                # If no Pasal match, treat as standalone chunk
                chunk_text = pasal_chunk.strip()
                if chunk_text:
                    context = self._build_context(metadata, bab=None, pasal=None)
                    chunks.append(self._create_chunk(chunk_text, context, metadata))
                continue

            pasal_num = pasal_match.group(1)
            pasal_text = pasal_match.group(2).strip()

            # Find BAB context if structure provided
            bab_context = None
            if structure:
                bab_context = self._find_bab_for_pasal(structure, pasal_num)

            # Check if Pasal is too large
            pasal_length = len(pasal_text)
            if pasal_length > self.max_pasal_tokens:
                # Split by Ayat
                logger.debug(f"Pasal {pasal_num} too large ({pasal_length} chars), splitting by Ayat")
                ayat_chunks = self._split_by_ayat(pasal_text, pasal_num)

                for ayat_chunk in ayat_chunks:
                    context = self._build_context(metadata, bab=bab_context, pasal=f"Pasal {pasal_num}")
                    chunks.append(self._create_chunk(ayat_chunk, context, metadata, pasal_num))
            else:
                # Keep Pasal as single chunk
                context = self._build_context(metadata, bab=bab_context, pasal=f"Pasal {pasal_num}")
                chunks.append(self._create_chunk(pasal_text, context, metadata, pasal_num))

        logger.info(f"Created {len(chunks)} legal chunks (Pasal-aware)")

        # Add chunk indices
        for idx, chunk in enumerate(chunks):
            chunk["chunk_index"] = idx
            chunk["total_chunks"] = len(chunks)

        return chunks

    def _split_by_pasal(self, text: str) -> list[str]:
        """
        Split text by Pasal markers.

        Args:
            text: Document text

        Returns:
            List of Pasal text chunks
        """
        # Split by Pasal pattern
        splits = PASAL_PATTERN.split(text)

        # First split is usually preamble (before first Pasal)
        pasal_chunks = []
        if splits[0].strip():
            pasal_chunks.append(splits[0].strip())

        # Process Pasal pairs (number, text)
        for i in range(1, len(splits), 2):
            if i + 1 < len(splits):
                pasal_num = splits[i]
                pasal_text = splits[i + 1]
                pasal_chunk = f"Pasal {pasal_num}\n{pasal_text}"
                pasal_chunks.append(pasal_chunk.strip())

        return pasal_chunks

    def _split_by_ayat(self, pasal_text: str, pasal_num: str) -> list[str]:
        """
        Split Pasal text by Ayat (clauses).

        Args:
            pasal_text: Pasal text content
            pasal_num: Pasal number

        Returns:
            List of Ayat text chunks
        """
        # Split by Ayat pattern: (1), (2), etc.
        import re

        ayat_pattern = re.compile(r"\((\d+)\)\s*(.+?)(?=\(\d+\)|$)", re.MULTILINE | re.DOTALL)
        ayat_matches = list(ayat_pattern.finditer(pasal_text))

        if not ayat_matches:
            # No Ayat found, return whole Pasal
            return [pasal_text]

        ayat_chunks = []
        for i, match in enumerate(ayat_matches):
            ayat_num = match.group(1)
            ayat_text = match.group(2).strip()

            # Include Pasal number in Ayat chunk
            ayat_chunk = f"Pasal {pasal_num} Ayat ({ayat_num})\n{ayat_text}"
            ayat_chunks.append(ayat_chunk)

        return ayat_chunks

    def _build_context(
        self,
        metadata: dict[str, Any],
        bab: str | None = None,
        pasal: str | None = None,
    ) -> str:
        """
        Build context string for chunk injection.

        Args:
            metadata: Document metadata
            bab: BAB context (optional)
            pasal: Pasal number (optional)

        Returns:
            Context string to prepend to chunk
        """
        type_abbrev = metadata.get("type_abbrev", "UNKNOWN")
        number = metadata.get("number", "UNKNOWN")
        year = metadata.get("year", "UNKNOWN")
        topic = metadata.get("topic", "UNKNOWN")

        # Build context parts
        context_parts = [type_abbrev, f"NO {number}", f"TAHUN {year}", f"TENTANG {topic}"]

        if bab:
            context_parts.append(bab)

        if pasal:
            context_parts.append(pasal)

        context_str = " - ".join(context_parts)

        return f"[CONTEXT: {context_str}]"

    def _create_chunk(
        self,
        content: str,
        context: str,
        metadata: dict[str, Any],
        pasal_num: str | None = None,
    ) -> dict[str, Any]:
        """
        Create a chunk dictionary with context injection.

        Args:
            content: Chunk content text
            context: Context string to prepend
            metadata: Base metadata
            pasal_num: Pasal number (optional)

        Returns:
            Chunk dictionary
        """
        # Inject context at the beginning
        chunk_text = f"{context}\n\n{content}"

        chunk = {
            "text": chunk_text,
            "chunk_length": len(chunk_text),
            "content_length": len(content),
            "has_context": True,
        }

        # Add metadata
        chunk.update(metadata)

        # Add Pasal info if available
        if pasal_num:
            chunk["pasal_number"] = pasal_num

        return chunk

    def _find_bab_for_pasal(self, structure: dict[str, Any], pasal_num: str) -> str | None:
        """
        Find which BAB a Pasal belongs to from structure.

        Args:
            structure: Parsed structure dictionary
            pasal_num: Pasal number

        Returns:
            BAB context string or None
        """
        batang_tubuh = structure.get("batang_tubuh", [])

        for bab in batang_tubuh:
            pasal_list = bab.get("pasal", [])
            for pasal in pasal_list:
                if pasal.get("number") == pasal_num:
                    return f"BAB {bab.get('number')} - {bab.get('title', '')}"

        return None

