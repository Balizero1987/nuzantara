import asyncio
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from app.core.gaston import get_gaston_response

app = FastAPI(title="Riri-a-Porter API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = None


class ChatResponse(BaseModel):
    response: str
    suggested_items: List[str] = []


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat with Gaston.
    """
    response_text = await get_gaston_response(request.message, request.context)
    return ChatResponse(response=response_text)


@app.post("/try-on")
async def try_on_endpoint(
    user_photo: UploadFile = File(...), garment_photo: UploadFile = File(...)
):
    """
    Mock Virtual Try-On. Returns a placeholder URL after a delay.
    """
    await asyncio.sleep(2)  # Simulate processing delay
    return {"result_url": "https://placehold.co/600x800?text=Magic+VTO+Result"}


@app.get("/shop")
async def shop_endpoint(q: str):
    """
    Mock Shopping Search.
    """
    # Mock results based on query or random
    mock_results = [
        {
            "name": "Red Velvet Dress",
            "price": "€120",
            "image": "https://placehold.co/300x400?text=Red+Dress",
            "store": "Zara",
        },
        {
            "name": "Vintage Denim Jacket",
            "price": "€85",
            "image": "https://placehold.co/300x400?text=Denim+Jacket",
            "store": "Levi's",
        },
        {
            "name": "Silk Scarf",
            "price": "€45",
            "image": "https://placehold.co/300x400?text=Silk+Scarf",
            "store": "Hermès",
        },
    ]
    return {"results": mock_results}


@app.get("/")
async def root():
    return {"message": "Bienvenue à Riri-a-Porter API"}
