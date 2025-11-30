"""
Agents Submodule - Individual Agent Implementations
Contains the core agent classes for different autonomous functions.
"""

from .conversation_trainer import ConversationTrainer
from .client_value_predictor import ClientValuePredictor
from .knowledge_graph_builder import KnowledgeGraphBuilder

__all__ = [
    "ConversationTrainer",
    "ClientValuePredictor",
    "KnowledgeGraphBuilder"
]