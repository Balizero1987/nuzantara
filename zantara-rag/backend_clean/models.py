from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Message] = []
    use_rag: bool = True
    model: str = "haiku"  # 'haiku' or 'sonnet'

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[dict]] = None