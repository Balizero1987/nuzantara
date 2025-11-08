"""
LangGraph Workflow for Collective Memory
Gestisce memoria collettiva intelligente (work + personal) con workflow condizionali
"""

from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional, Dict
from enum import Enum
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class MemoryCategory(str, Enum):
    WORK = "work"
    PERSONAL = "personal"
    RELATIONSHIP = "relationship"
    CULTURAL = "cultural"
    PREFERENCE = "preference"
    MILESTONE = "milestone"


class CollectiveMemoryState(TypedDict):
    # Input
    query: str
    user_id: str
    session_id: str
    participants: List[str]  # Chi è coinvolto nella conversazione
    
    # Analisi
    detected_category: Optional[MemoryCategory]
    detected_type: Optional[str]  # 'fact', 'preference', 'story', etc.
    extracted_entities: List[Dict]  # Persone, luoghi, eventi menzionati
    sentiment: Optional[str]  # 'positive', 'neutral', 'negative'
    importance_score: float
    personal_importance: float
    
    # Consolidamento
    existing_memories: List[Dict]  # Memorie esistenti correlate
    needs_consolidation: bool
    consolidation_actions: List[str]
    
    # Relazioni
    relationships_to_update: List[Dict]
    new_relationships: List[Dict]
    
    # Output
    memory_to_store: Optional[Dict]
    relationships_to_store: List[Dict]
    profile_updates: List[Dict]
    
    # Metadati
    confidence: float
    errors: List[str]


def extract_person_names(text: str) -> List[str]:
    """Estrae nomi di persone dal testo (semplificato)"""
    # TODO: Usare NER più sofisticato
    common_names = ['antonello', 'maria', 'giovanni', 'luca', 'sara']
    found = []
    text_lower = text.lower()
    for name in common_names:
        if name in text_lower:
            found.append(name)
    return found


def merge_memories(existing: List[Dict], new_content: str) -> Dict:
    """Unifica memorie esistenti con nuovo contenuto"""
    if not existing:
        return {"content": new_content}
    
    # Prendi la memoria più recente come base
    latest = existing[0]
    return {
        "content": f"{latest.get('content', '')}\n{new_content}",
        "memory_key": latest.get('memory_key'),
        "updated": True
    }


def detect_conflicts(existing: List[Dict], new_content: str) -> List[str]:
    """Rileva conflitti tra memorie esistenti e nuovo contenuto"""
    conflicts = []
    # TODO: Implementare logica di rilevamento conflitti
    return conflicts


def extract_preferences(text: str) -> Dict[str, str]:
    """Estrae preferenze dal testo"""
    preferences = {}
    text_lower = text.lower()
    
    # Pattern matching semplice
    if 'preferisce' in text_lower or 'preferisco' in text_lower:
        if 'espresso' in text_lower:
            preferences['coffee'] = 'espresso'
        if 'americano' in text_lower:
            preferences['coffee'] = 'americano'
    
    return preferences


async def analyze_content_intent(state: CollectiveMemoryState) -> CollectiveMemoryState:
    """Analizza intent e categoria della memoria"""
    query = state["query"].lower()
    
    # Rileva categoria
    if any(word in query for word in ["preferisco", "mi piace", "non mi piace", "amo", "odio"]):
        state["detected_category"] = MemoryCategory.PREFERENCE
    elif any(word in query for word in ["compleanno", "anniversario", "festa", "celebrazione"]):
        state["detected_category"] = MemoryCategory.MILESTONE
    elif any(word in query for word in ["amicizia", "conosco", "incontri", "social"]):
        state["detected_category"] = MemoryCategory.RELATIONSHIP
    elif any(word in query for word in ["cultura", "tradizione", "costume", "locale"]):
        state["detected_category"] = MemoryCategory.CULTURAL
    else:
        state["detected_category"] = MemoryCategory.WORK
    
    # Rileva tipo
    if state["detected_category"] == MemoryCategory.PREFERENCE:
        state["detected_type"] = "preference"
    elif state["detected_category"] == MemoryCategory.MILESTONE:
        state["detected_type"] = "milestone"
    else:
        state["detected_type"] = "fact"
    
    return state


async def extract_entities_and_relationships(state: CollectiveMemoryState) -> CollectiveMemoryState:
    """Estrae entità e relazioni"""
    query = state["query"]
    
    # Estrai nomi di persone
    participants = extract_person_names(query)
    if not participants and state.get("user_id"):
        participants = [state["user_id"]]
    
    state["participants"] = participants
    state["extracted_entities"] = []  # TODO: Integrare con MCP Memory
    
    return state


async def check_existing_memories(state: CollectiveMemoryState, memory_service) -> CollectiveMemoryState:
    """Verifica memorie esistenti correlate"""
    # Cerca memorie simili (semplificato)
    # TODO: Implementare ricerca semantica nel database
    state["existing_memories"] = []
    state["needs_consolidation"] = False
    
    return state


async def categorize_memory(state: CollectiveMemoryState) -> CollectiveMemoryState:
    """Categorizza memoria (già fatto in analyze_content_intent)"""
    return state


async def assess_personal_importance(state: CollectiveMemoryState) -> CollectiveMemoryState:
    """Valuta importanza personale (non solo lavorativa)"""
    category = state["detected_category"]
    participants_count = len(state["participants"])
    
    # Calcola importanza basata su categoria
    if category == MemoryCategory.MILESTONE:
        importance = 0.9
    elif category == MemoryCategory.RELATIONSHIP:
        importance = 0.8
    elif category == MemoryCategory.PREFERENCE:
        importance = 0.6
    else:
        importance = 0.5
    
    state["importance_score"] = importance
    state["personal_importance"] = importance * 1.2  # Boost per importanza personale
    
    return state


async def consolidate_with_existing(state: CollectiveMemoryState) -> CollectiveMemoryState:
    """Consolida con memorie esistenti"""
    existing = state["existing_memories"]
    new_content = state["query"]
    
    if existing:
        consolidated = merge_memories(existing, new_content)
        conflicts = detect_conflicts(existing, new_content)
        
        if conflicts:
            state["consolidation_actions"].append(f"Conflict detected: {conflicts}")
        
        state["memory_to_store"] = consolidated
    else:
        state["memory_to_store"] = {"content": new_content}
    
    return state


async def update_team_relationships(state: CollectiveMemoryState) -> CollectiveMemoryState:
    """Aggiorna relazioni tra membri del team"""
    participants = state["participants"]
    category = state["detected_category"]
    
    if len(participants) >= 2 and category in [MemoryCategory.RELATIONSHIP, MemoryCategory.MILESTONE]:
        for i, member_a in enumerate(participants):
            for member_b in participants[i+1:]:
                relationship = {
                    "member_a": member_a,
                    "member_b": member_b,
                    "relationship_type": "friendship" if category == MemoryCategory.RELATIONSHIP else "social",
                    "last_interaction": datetime.now().isoformat()
                }
                state["relationships_to_update"].append(relationship)
    
    return state


async def update_member_profiles(state: CollectiveMemoryState) -> CollectiveMemoryState:
    """Aggiorna profili personali dei membri"""
    if state["detected_category"] == MemoryCategory.PREFERENCE:
        preferences = extract_preferences(state["query"])
        for participant in state["participants"]:
            state["profile_updates"].append({
                "member_id": participant,
                "preferences": preferences
            })
    
    return state


async def store_collective_memory(state: CollectiveMemoryState, memory_service) -> CollectiveMemoryState:
    """Salva memoria collettiva"""
    if state["memory_to_store"]:
        # TODO: Salvare nel database via memory_service
        logger.info(f"💾 Storing collective memory: {state['memory_to_store']}")
    
    return state


def route_by_existence(state: CollectiveMemoryState) -> str:
    """Routing basato su esistenza memorie"""
    if state["needs_consolidation"]:
        return "consolidate"
    elif state["existing_memories"]:
        return "exists"
    else:
        return "new"


def route_by_importance(state: CollectiveMemoryState) -> str:
    """Routing basato su importanza"""
    if state["personal_importance"] >= 0.8:
        return "high"
    elif state["personal_importance"] >= 0.6:
        return "medium"
    else:
        return "low"


def create_collective_memory_workflow(memory_service=None, mcp_client=None):
    """Crea workflow LangGraph per memoria collettiva intelligente"""
    
    workflow = StateGraph(CollectiveMemoryState)
    
    # NODES
    workflow.add_node("analyze_content", analyze_content_intent)
    workflow.add_node("extract_entities", extract_entities_and_relationships)
    workflow.add_node("check_existing", lambda s: check_existing_memories(s, memory_service))
    workflow.add_node("categorize", categorize_memory)
    workflow.add_node("assess_importance", assess_personal_importance)
    workflow.add_node("consolidate", consolidate_with_existing)
    workflow.add_node("update_relationships", update_team_relationships)
    workflow.add_node("update_profiles", update_member_profiles)
    workflow.add_node("store_memory", lambda s: store_collective_memory(s, memory_service))
    
    # FLOW
    workflow.set_entry_point("analyze_content")
    
    workflow.add_edge("analyze_content", "extract_entities")
    workflow.add_edge("extract_entities", "check_existing")
    
    workflow.add_conditional_edges(
        "check_existing",
        route_by_existence,
        {
            "new": "categorize",
            "exists": "consolidate",
            "consolidate": "consolidate"
        }
    )
    
    workflow.add_edge("categorize", "assess_importance")
    workflow.add_edge("consolidate", "assess_importance")
    workflow.add_edge("assess_importance", "update_relationships")
    
    workflow.add_conditional_edges(
        "update_relationships",
        route_by_importance,
        {
            "high": "update_profiles",
            "medium": "store_memory",
            "low": "store_memory"
        }
    )
    
    workflow.add_edge("update_profiles", "store_memory")
    workflow.add_edge("store_memory", END)
    
    return workflow.compile()

