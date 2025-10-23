"""AI Analysis result models"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class ImpactLevel(str, Enum):
    """Impact level for content"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Urgency(str, Enum):
    """Urgency level"""
    IMMEDIATE = "immediate"
    SOON = "soon"
    FUTURE = "future"
    NONE = "none"


class AIAnalysisResult(BaseModel):
    """Result from AI content analysis"""

    # Summaries
    summary_id: Optional[str] = None  # Indonesian
    summary_en: Optional[str] = None  # English

    # Classification
    topics: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    entities: List[str] = Field(default_factory=list)

    # Impact assessment
    impact_level: ImpactLevel = ImpactLevel.LOW
    urgency: Urgency = Urgency.NONE
    affected_groups: List[str] = Field(default_factory=list)

    # Extracted information
    key_dates: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)
    amounts: List[Dict[str, Any]] = Field(default_factory=list)
    deadlines: List[str] = Field(default_factory=list)

    # Quality metrics
    quality_score: float = 0.0
    relevance_score: float = 0.0
    confidence: float = 0.0

    # Provider info
    ai_provider: str = "unknown"
    model_used: Optional[str] = None

    # Raw response (for debugging)
    raw_response: Optional[Dict[str, Any]] = None
