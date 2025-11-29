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
        result = await service.generate_image(request.prompt)

        if result["success"]:
            return {
                "success": True,
                "url": result["url"],
                "prompt": result.get("prompt"),
                "service": result.get("service", "unknown"),
            }
        else:
            # Return proper HTTP status codes for different error types
            if "not configured" in result["error"]:
                raise HTTPException(status_code=503, detail=result)
            elif "Invalid prompt" in result["error"]:
                raise HTTPException(status_code=400, detail=result)
            else:
                raise HTTPException(status_code=500, detail=result)

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "Internal server error", "details": str(e)},
        ) from e
