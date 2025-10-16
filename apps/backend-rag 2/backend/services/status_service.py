"""
Status Service - Real-time status updates for AI processing
Provides transparency about what the system is doing at each stage

This service enables real-time status indicators to show users exactly
what's happening during AI processing, reducing perceived wait time and
building trust through transparency.

Author: ZANTARA Development Team
Date: 2025-10-16
"""

import logging
from typing import Dict, Any
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)


class ProcessingStage(Enum):
    """
    Processing stages with user-friendly messages

    Each stage represents a distinct phase of AI processing,
    with messages designed to be shown directly to users.
    """
    RECEIVED = "Message received"
    ROUTING = "Analyzing your question..."
    MEMORY_LOADING = "Consulting your history..."
    EMOTIONAL_ANALYSIS = "Understanding context..."
    RAG_SEARCH = "Searching knowledge base..."
    GENERATING = "Generating response..."
    FINALIZING = "Finalizing answer..."
    COMPLETE = "Done"
    ERROR = "An error occurred"


class StatusService:
    """
    Manages real-time status updates during AI processing

    Features:
    - Standardized status messages for each processing stage
    - Automatic timestamp generation
    - Support for additional contextual details
    - Integration with SSE streaming
    """

    def __init__(self):
        """Initialize status service"""
        logger.info("✅ StatusService initialized")


    async def send_status_update(
        self,
        stage: ProcessingStage,
        details: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create status update event

        Args:
            stage: Current processing stage
            details: Optional additional context (model name, user level, etc.)

        Returns:
            Status update dictionary ready for SSE transmission:
            {
                "type": "status",
                "stage": "routing",
                "message": "Analyzing your question...",
                "timestamp": "2025-10-16T10:30:00Z",
                "details": {...}
            }
        """
        status_update = {
            "type": "status",
            "stage": stage.name.lower(),
            "message": stage.value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "details": details or {}
        }

        logger.debug(f"📊 [Status] {stage.value} {f'({details})' if details else ''}")

        return status_update


    def get_stage_for_operation(self, operation: str) -> ProcessingStage:
        """
        Map operation names to appropriate processing stages

        Args:
            operation: Operation identifier (e.g., "memory_load", "rag_search")

        Returns:
            Corresponding ProcessingStage
        """
        operation_map = {
            "received": ProcessingStage.RECEIVED,
            "routing": ProcessingStage.ROUTING,
            "classification": ProcessingStage.ROUTING,
            "memory_load": ProcessingStage.MEMORY_LOADING,
            "memory": ProcessingStage.MEMORY_LOADING,
            "emotional": ProcessingStage.EMOTIONAL_ANALYSIS,
            "emotion": ProcessingStage.EMOTIONAL_ANALYSIS,
            "rag": ProcessingStage.RAG_SEARCH,
            "search": ProcessingStage.RAG_SEARCH,
            "knowledge": ProcessingStage.RAG_SEARCH,
            "generating": ProcessingStage.GENERATING,
            "generation": ProcessingStage.GENERATING,
            "ai": ProcessingStage.GENERATING,
            "finalizing": ProcessingStage.FINALIZING,
            "complete": ProcessingStage.COMPLETE,
            "done": ProcessingStage.COMPLETE,
            "error": ProcessingStage.ERROR,
            "failed": ProcessingStage.ERROR
        }

        return operation_map.get(operation.lower(), ProcessingStage.GENERATING)


    def format_for_sse(self, status_update: Dict[str, Any]) -> str:
        """
        Format status update as Server-Sent Event

        Args:
            status_update: Status update dictionary

        Returns:
            Formatted SSE string
        """
        import json

        data_str = json.dumps(status_update)
        return f"event: status\ndata: {data_str}\n\n"


    def get_estimated_time(self, stage: ProcessingStage) -> Dict[str, Any]:
        """
        Get estimated time for each processing stage

        Args:
            stage: Processing stage

        Returns:
            Timing information:
            {
                "estimated_ms": int,
                "display_text": str
            }
        """
        # Estimated times based on typical performance
        stage_times = {
            ProcessingStage.RECEIVED: {"ms": 0, "text": "instant"},
            ProcessingStage.ROUTING: {"ms": 100, "text": "< 1 second"},
            ProcessingStage.MEMORY_LOADING: {"ms": 50, "text": "< 1 second"},
            ProcessingStage.EMOTIONAL_ANALYSIS: {"ms": 50, "text": "< 1 second"},
            ProcessingStage.RAG_SEARCH: {"ms": 500, "text": "1-2 seconds"},
            ProcessingStage.GENERATING: {"ms": 3000, "text": "2-5 seconds"},
            ProcessingStage.FINALIZING: {"ms": 100, "text": "< 1 second"},
            ProcessingStage.COMPLETE: {"ms": 0, "text": "done"}
        }

        timing = stage_times.get(stage, {"ms": 1000, "text": "~1 second"})

        return {
            "estimated_ms": timing["ms"],
            "display_text": timing["text"]
        }


    def create_progress_indicator(
        self,
        current_stage: ProcessingStage,
        all_stages: list = None
    ) -> Dict[str, Any]:
        """
        Create progress indicator showing current stage in overall flow

        Args:
            current_stage: Current processing stage
            all_stages: Optional list of stages (defaults to standard flow)

        Returns:
            Progress information:
            {
                "current": "routing",
                "total_stages": 7,
                "current_index": 1,
                "percentage": 14.3,
                "remaining_stages": ["memory_loading", "rag_search", ...]
            }
        """
        if all_stages is None:
            all_stages = [
                ProcessingStage.RECEIVED,
                ProcessingStage.ROUTING,
                ProcessingStage.MEMORY_LOADING,
                ProcessingStage.RAG_SEARCH,
                ProcessingStage.GENERATING,
                ProcessingStage.FINALIZING,
                ProcessingStage.COMPLETE
            ]

        try:
            current_index = all_stages.index(current_stage)
            total = len(all_stages)
            percentage = (current_index / (total - 1)) * 100 if total > 1 else 100

            remaining = all_stages[current_index + 1:] if current_index < total - 1 else []

            return {
                "current": current_stage.name.lower(),
                "total_stages": total,
                "current_index": current_index,
                "percentage": round(percentage, 1),
                "remaining_stages": [stage.name.lower() for stage in remaining]
            }
        except ValueError:
            # Stage not in list
            return {
                "current": current_stage.name.lower(),
                "total_stages": len(all_stages),
                "current_index": 0,
                "percentage": 0,
                "remaining_stages": []
            }


    def get_localized_message(
        self,
        stage: ProcessingStage,
        language: str = "en"
    ) -> str:
        """
        Get localized status message

        Args:
            stage: Processing stage
            language: Language code (en, it, id)

        Returns:
            Localized message string
        """
        messages = {
            ProcessingStage.RECEIVED: {
                "en": "Message received",
                "it": "Messaggio ricevuto",
                "id": "Pesan diterima"
            },
            ProcessingStage.ROUTING: {
                "en": "Analyzing your question...",
                "it": "Analizzando la tua domanda...",
                "id": "Menganalisis pertanyaan Anda..."
            },
            ProcessingStage.MEMORY_LOADING: {
                "en": "Consulting your history...",
                "it": "Consultando la cronologia...",
                "id": "Mengecek riwayat Anda..."
            },
            ProcessingStage.EMOTIONAL_ANALYSIS: {
                "en": "Understanding context...",
                "it": "Comprendendo il contesto...",
                "id": "Memahami konteks..."
            },
            ProcessingStage.RAG_SEARCH: {
                "en": "Searching knowledge base...",
                "it": "Cercando nella knowledge base...",
                "id": "Mencari di basis pengetahuan..."
            },
            ProcessingStage.GENERATING: {
                "en": "Generating response...",
                "it": "Generando risposta...",
                "id": "Menghasilkan respons..."
            },
            ProcessingStage.FINALIZING: {
                "en": "Finalizing answer...",
                "it": "Finalizzando risposta...",
                "id": "Menyelesaikan jawaban..."
            },
            ProcessingStage.COMPLETE: {
                "en": "Done",
                "it": "Fatto",
                "id": "Selesai"
            },
            ProcessingStage.ERROR: {
                "en": "An error occurred",
                "it": "Si è verificato un errore",
                "id": "Terjadi kesalahan"
            }
        }

        stage_messages = messages.get(stage, {})
        return stage_messages.get(language, stage.value)


    async def health_check(self) -> Dict[str, Any]:
        """
        Health check for status service

        Returns:
            {
                "status": "healthy",
                "stages_available": 9,
                "localization_support": ["en", "it", "id"]
            }
        """
        return {
            "status": "healthy",
            "stages_available": len(ProcessingStage),
            "localization_support": ["en", "it", "id"],
            "features": {
                "progress_tracking": True,
                "estimated_times": True,
                "sse_formatting": True,
                "localization": True
            }
        }
