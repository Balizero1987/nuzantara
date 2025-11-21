# Module Usage Examples

This document shows how to use each module independently.

## 1. IntentClassifier

### Standalone Usage
```python
from services.classification import IntentClassifier

# Initialize (no dependencies needed)
classifier = IntentClassifier()

# Classify a greeting
result = await classifier.classify_intent("Hello!")
print(result)
# Output: {
#     "category": "greeting",
#     "confidence": 1.0,
#     "suggested_ai": "haiku",
#     "require_memory": True
# }

# Classify a business query
result = await classifier.classify_intent("What is KITAS?")
print(result)
# Output: {
#     "category": "business_simple",
#     "confidence": 0.9,
#     "suggested_ai": "haiku"
# }

# Classify a complex query
result = await classifier.classify_intent("How do I setup a PT PMA step by step?")
print(result)
# Output: {
#     "category": "business_complex",
#     "confidence": 0.9,
#     "suggested_ai": "sonnet"
# }
```

### Use in Other Services
```python
from services.classification import IntentClassifier

class MyCustomService:
    def __init__(self):
        self.classifier = IntentClassifier()
    
    async def handle_message(self, message: str):
        intent = await self.classifier.classify_intent(message)
        
        if intent["category"] == "greeting":
            return "Hello! How can I help?"
        elif intent["category"] == "business_simple":
            return await self.simple_business_handler(message)
        else:
            return await self.complex_business_handler(message)
```

## 2. RAGManager

### Standalone Usage
```python
from services.context import RAGManager
from services.search_service import SearchService

# Initialize with search service
search = SearchService(...)
rag_manager = RAGManager(search)

# Retrieve context for business query
result = await rag_manager.retrieve_context(
    query="What are KITAS requirements?",
    query_type="business",
    user_level=0,
    limit=5
)
print(result)
# Output: {
#     "context": "📄 KITAS Guide: ... (RAG content)",
#     "used_rag": True,
#     "document_count": 5
# }

# Skips RAG for greetings
result = await rag_manager.retrieve_context(
    query="Hello",
    query_type="greeting",
    user_level=0,
    limit=5
)
print(result)
# Output: {
#     "context": None,
#     "used_rag": False,
#     "document_count": 0
# }
```

### Use in Other Services
```python
from services.context import RAGManager

class MyRAGService:
    def __init__(self, search_service):
        self.rag = RAGManager(search_service)
    
    async def answer_question(self, question: str):
        # Get RAG context
        rag_result = await self.rag.retrieve_context(
            query=question,
            query_type="business",
            user_level=2,
            limit=10
        )
        
        if rag_result["used_rag"]:
            return f"Based on {rag_result['document_count']} documents: {rag_result['context']}"
        else:
            return "No relevant documents found"
```

## 3. ContextBuilder

### Standalone Usage
```python
from services.context import ContextBuilder

# Initialize (no dependencies needed)
builder = ContextBuilder()

# Build memory context
class MockMemory:
    profile_facts = [
        "You're talking to Alice, Level 2 collaborator",
        "Alice prefers Italian language",
        "Previous discussion about KITAS"
    ]
    summary = "User asked about visa requirements"

memory = MockMemory()
memory_context = builder.build_memory_context(memory)
print(memory_context)
# Output: "Context about this conversation:\nYou're talking to Alice..."

# Build team context
class MockCollaborator:
    id = "alice123"
    name = "Alice"
    ambaradam_name = "Alice Cooper"
    role = "Business Consultant"
    department = "Legal"
    language = "it"
    expertise_level = "advanced"
    sub_rosa_level = 2
    emotional_preferences = {
        "tone": "professional_warm",
        "formality": "medium",
        "humor": "light"
    }

collaborator = MockCollaborator()
team_context = builder.build_team_context(collaborator)
print(team_context)
# Output: "IMPORTANT: You MUST respond ONLY in Italian language. You're talking to Alice..."

# Combine all contexts
combined = builder.combine_contexts(
    memory_context=memory_context,
    team_context=team_context,
    rag_context="📄 KITAS Guide: Requirements...",
    cultural_context="Indonesian cultural note: ..."
)
print(combined)
# Output: Full combined context with all sources
```

### Use in Other Services
```python
from services.context import ContextBuilder

class MyContextualService:
    def __init__(self):
        self.builder = ContextBuilder()
    
    async def prepare_context(self, user, memory, rag_docs):
        # Build individual contexts
        memory_ctx = self.builder.build_memory_context(memory)
        team_ctx = self.builder.build_team_context(user)
        
        # Combine
        full_context = self.builder.combine_contexts(
            memory_context=memory_ctx,
            team_context=team_ctx,
            rag_context=rag_docs,
            cultural_context=None
        )
        
        return full_context
```

## 4. SpecializedServiceRouter

### Standalone Usage
```python
from services.routing import SpecializedServiceRouter
from services.autonomous_research_service import AutonomousResearchService
from services.cross_oracle_synthesis_service import CrossOracleSynthesisService

# Initialize with specialized services
research_service = AutonomousResearchService(...)
oracle_service = CrossOracleSynthesisService(...)
router = SpecializedServiceRouter(research_service, oracle_service)

# Detect if autonomous research is needed
message = "How do I setup a crypto business in Bali?"
category = "business_complex"
needs_research = router.detect_autonomous_research(message, category)
print(needs_research)  # True (crypto is ambiguous)

# Route to autonomous research
if needs_research:
    result = await router.route_autonomous_research(message, user_level=3)
    print(result["response"])
    print(result["autonomous_research"])  # Metadata

# Detect if cross-oracle is needed
message2 = "I want to open a restaurant in Bali. What's the complete process?"
needs_oracle = router.detect_cross_oracle(message2, "business_complex")
print(needs_oracle)  # True (business setup)

# Route to cross-oracle
if needs_oracle:
    result = await router.route_cross_oracle(message2, user_level=3)
    print(result["response"])
    print(result["cross_oracle_synthesis"])  # Metadata
```

### Use in Other Services
```python
from services.routing import SpecializedServiceRouter

class MyIntelligentService:
    def __init__(self, research, oracle):
        self.router = SpecializedServiceRouter(research, oracle)
    
    async def handle_complex_query(self, query: str, category: str):
        # Try autonomous research first
        if self.router.detect_autonomous_research(query, category):
            return await self.router.route_autonomous_research(query)
        
        # Try cross-oracle second
        if self.router.detect_cross_oracle(query, category):
            return await self.router.route_cross_oracle(query)
        
        # Fallback to regular handling
        return await self.regular_handler(query)
```

## 5. ResponseHandler

### Standalone Usage
```python
from services.routing import ResponseHandler

# Initialize (no dependencies needed)
handler = ResponseHandler()

# Classify query type
query_type = handler.classify_query("Hello!")
print(query_type)  # "greeting"

query_type = handler.classify_query("What is KITAS?")
print(query_type)  # "business"

# Sanitize a response
raw_response = """
[PRICE] The KITAS costs vary.
User: What about timeline?
Assistant: The timeline is...
### **Requirements**
- Passport
"""

sanitized = handler.sanitize_response(
    response=raw_response,
    query_type="business",
    apply_santai=False,  # Don't truncate business responses
    add_contact=True     # Add contact info
)
print(sanitized)
# Output: Clean response without [PRICE], User:, Assistant:, markdown headers

# Sanitize greeting (with SANTAI mode)
greeting_response = "Ciao! Come stai? Sono Zantara, il tuo assistente virtuale per tutto quello che riguarda Bali e l'Indonesia. Posso aiutarti con visa, business setup, e molto altro ancora!"

sanitized = handler.sanitize_response(
    response=greeting_response,
    query_type="greeting",
    apply_santai=True,   # Enforce max 30 words
    add_contact=False    # No contact for greetings
)
print(sanitized)
# Output: Truncated to ~30 words, no contact info
```

### Use in Other Services
```python
from services.routing import ResponseHandler

class MyResponseService:
    def __init__(self):
        self.handler = ResponseHandler()
    
    async def process_response(self, query: str, ai_response: str):
        # Classify query
        query_type = self.handler.classify_query(query)
        
        # Sanitize based on type
        clean_response = self.handler.sanitize_response(
            response=ai_response,
            query_type=query_type,
            apply_santai=(query_type in ["greeting", "casual"]),
            add_contact=(query_type not in ["greeting", "casual"])
        )
        
        return clean_response
```

## 6. ToolManager

### Standalone Usage
```python
from services.tools import ToolManager
from services.tool_executor import ToolExecutor

# Initialize with tool executor
executor = ToolExecutor(...)
manager = ToolManager(executor)

# Load tools (caches them)
await manager.load_tools()

# Get tools for Haiku (limited, fast tools)
haiku_tools = manager.get_available_tools("haiku")
print(f"Haiku has {len(haiku_tools)} tools")

# Get tools for Sonnet (all tools)
sonnet_tools = manager.get_available_tools("sonnet")
print(f"Sonnet has {len(sonnet_tools)} tools")

# Detect if prefetch is needed
message = "What's the price for KITAS?"
tool_needs = manager.detect_tool_needs(message)
print(tool_needs)
# Output: {
#     "should_prefetch": True,
#     "tool_name": "get_pricing",
#     "tool_input": {"service_type": "all"}
# }

message2 = "Who is on the team?"
tool_needs = manager.detect_tool_needs(message2)
print(tool_needs)
# Output: {
#     "should_prefetch": True,
#     "tool_name": "get_team_members_list",
#     "tool_input": {}
# }
```

### Use in Other Services
```python
from services.tools import ToolManager

class MyToolService:
    def __init__(self, tool_executor):
        self.manager = ToolManager(tool_executor)
    
    async def handle_with_tools(self, message: str, model: str = "haiku"):
        # Load tools once
        await self.manager.load_tools()
        
        # Get appropriate tools for model
        tools = self.manager.get_available_tools(model)
        
        # Check if we need to prefetch
        tool_needs = self.manager.detect_tool_needs(message)
        
        if tool_needs["should_prefetch"]:
            # Prefetch before AI call
            result = await self.manager.tool_executor.execute_tool(
                tool_name=tool_needs["tool_name"],
                tool_input=tool_needs["tool_input"]
            )
            # Use prefetched data...
        
        # Use tools in AI call
        return await self.ai_service.call_with_tools(message, tools)
```

## 7. Full Integration Example

### Using All Modules Together (Custom Service)
```python
from services.classification import IntentClassifier
from services.context import ContextBuilder, RAGManager
from services.routing import SpecializedServiceRouter, ResponseHandler
from services.tools import ToolManager

class MyCustomRouter:
    def __init__(self, search_service, tool_executor, research_service, oracle_service):
        # Initialize all modules
        self.classifier = IntentClassifier()
        self.rag = RAGManager(search_service)
        self.context = ContextBuilder()
        self.specialized = SpecializedServiceRouter(research_service, oracle_service)
        self.response = ResponseHandler()
        self.tools = ToolManager(tool_executor)
    
    async def route(self, message: str, user_id: str, memory=None, collaborator=None):
        # Step 1: Classify intent
        intent = await self.classifier.classify_intent(message)
        
        # Step 2: Classify query type
        query_type = self.response.classify_query(message)
        
        # Step 3: Get RAG context
        rag_result = await self.rag.retrieve_context(message, query_type)
        
        # Step 4: Build contexts
        memory_ctx = self.context.build_memory_context(memory)
        team_ctx = self.context.build_team_context(collaborator)
        combined_ctx = self.context.combine_contexts(
            memory_ctx, team_ctx, rag_result["context"], None
        )
        
        # Step 5: Check specialized routing
        if self.specialized.detect_autonomous_research(message, intent["category"]):
            return await self.specialized.route_autonomous_research(message)
        
        if self.specialized.detect_cross_oracle(message, intent["category"]):
            return await self.specialized.route_cross_oracle(message)
        
        # Step 6: Load tools
        await self.tools.load_tools()
        tools = self.tools.get_available_tools("haiku")
        
        # Step 7: Call AI with context and tools
        ai_response = await self.ai_service.call(message, combined_ctx, tools)
        
        # Step 8: Sanitize response
        clean_response = self.response.sanitize_response(
            ai_response, query_type, apply_santai=True, add_contact=True
        )
        
        return {
            "response": clean_response,
            "intent": intent,
            "used_rag": rag_result["used_rag"]
        }
```

## Testing Examples

### Unit Test for IntentClassifier
```python
import pytest
from services.classification import IntentClassifier

@pytest.mark.asyncio
async def test_greeting_classification():
    classifier = IntentClassifier()
    result = await classifier.classify_intent("Hello")
    assert result["category"] == "greeting"
    assert result["confidence"] == 1.0
    assert result["suggested_ai"] == "haiku"

@pytest.mark.asyncio
async def test_business_simple_classification():
    classifier = IntentClassifier()
    result = await classifier.classify_intent("What is KITAS?")
    assert result["category"] == "business_simple"
    assert result["suggested_ai"] == "haiku"
```

### Unit Test for RAGManager
```python
import pytest
from services.context import RAGManager

@pytest.mark.asyncio
async def test_rag_skip_for_greeting(mock_search_service):
    rag = RAGManager(mock_search_service)
    result = await rag.retrieve_context("Hello", "greeting")
    assert result["used_rag"] is False
    assert result["context"] is None

@pytest.mark.asyncio
async def test_rag_retrieval_for_business(mock_search_service):
    rag = RAGManager(mock_search_service)
    result = await rag.retrieve_context("What is KITAS?", "business")
    assert result["used_rag"] is True
    assert result["context"] is not None
```

### Unit Test for ContextBuilder
```python
import pytest
from services.context import ContextBuilder

def test_memory_context_building():
    builder = ContextBuilder()
    
    class MockMemory:
        profile_facts = ["Fact 1", "Fact 2"]
        summary = "Previous conversation"
    
    result = builder.build_memory_context(MockMemory())
    assert "Fact 1" in result
    assert "Fact 2" in result
    assert "Previous conversation" in result

def test_memory_context_none_when_no_memory():
    builder = ContextBuilder()
    result = builder.build_memory_context(None)
    assert result is None
```

## Migration Guide

If you're currently using the old monolithic `intelligent_router.py`:

### No Changes Required!
The public API is unchanged. Your existing code will work as-is:
```python
# Your existing code (works unchanged)
router = IntelligentRouter(llama, haiku, search, tools)
result = await router.route_chat(message, user_id)
```

### Optional: Use Modules Independently
If you want to leverage the modules in other services:
```python
# New capability: use modules anywhere
from services.classification import IntentClassifier
from services.context import RAGManager, ContextBuilder

# Use in your custom service
classifier = IntentClassifier()
intent = await classifier.classify_intent(message)
```

