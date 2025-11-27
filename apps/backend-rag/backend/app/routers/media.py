import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.image_generation_service import ImageGenerationService

router = APIRouter(prefix="/media", tags=["media"])
logger = logging.getLogger(__name__)

class ImagePrompt(BaseModel):
    prompt: str

@router.post("/generate-image")
async def generate_image(request: ImagePrompt):
    """
    Generate an image from a text prompt.
    """
    try:
        service = ImageGenerationService()
        image_url = await service.generate_image(request.prompt)
        return {"url": image_url}
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
