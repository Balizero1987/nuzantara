"""
JIWA-Router Bridge - Connecting Technical Intelligence with Indonesian Soul
===========================================================================
This module bridges the FLAN-T5 router with Ibu Nuzantara's JIWA system.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import asyncio
import sys
from pathlib import Path
import logging

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.jiwa_heart import get_jiwa_heart
from core.soul_reader import SoulReader
from middleware.jiwa_middleware import create_jiwa_middleware

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app for JIWA services
app = FastAPI(
    title="JIWA Soul Service",
    description="Indonesian soul reading and infusion for ZANTARA",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize JIWA components
soul_reader = SoulReader()
jiwa_heart = get_jiwa_heart()
jiwa_middleware = create_jiwa_middleware()

# Request/Response models
class SoulReadingRequest(BaseModel):
    query: str
    user_id: Optional[str] = "anonymous"
    context: Optional[Dict[str, Any]] = None
    language: Optional[str] = "id"  # Default Indonesian

class SoulReadingResponse(BaseModel):
    primary_need: str
    emotional_tone: str
    urgency_level: int
    protection_needed: bool
    hidden_pain: Optional[str]
    strength_detected: Optional[str]
    maternal_guidance: str
    cultural_context: Dict[str, Any]
    blessing_type: Optional[str]

class InfusionRequest(BaseModel):
    response: str
    soul_reading: Dict[str, Any]
    language: str = "id"
    add_blessing: bool = True

class InfusionResponse(BaseModel):
    infused_response: str
    maternal_warmth: float
    blessing_added: bool
    cultural_elements: List[str]


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    heart_status = jiwa_heart.get_status()
    return {
        "status": "healthy",
        "service": "JIWA Soul Service",
        "heartbeats": heart_status["heartbeats"],
        "souls_touched": heart_status["souls_touched"],
        "protections_active": heart_status["protections_activated"]
    }


@app.post("/read-soul", response_model=SoulReadingResponse)
async def read_soul(request: SoulReadingRequest):
    """
    Read the soul of a user's query

    This endpoint analyzes the emotional and spiritual needs
    behind a user's message.
    """
    try:
        logger.info(f"📖 Reading soul for user {request.user_id}")

        # Read the soul
        reading = soul_reader.read_soul(request.query, request.context)

        # Touch soul with heart
        soul_touch = jiwa_heart.touch_soul(request.user_id,
                                          reading.primary_need.value)

        # Generate maternal guidance based on language
        if request.language == "id":
            guidance = soul_touch["maternal_message"]
        else:
            # Translate to English if needed
            guidance_map = {
                "help": "Mother is here. Tell me your problem.",
                "protect": "Don't be afraid, Mother will protect you.",
                "guide": "Let Mother show you the way.",
                "celebrate": "Mother is proud of you!",
                "comfort": "There there, it's okay. Mother is here."
            }
            guidance = guidance_map.get(
                reading.primary_need.value.split('_')[0],
                "Mother is always here for you."
            )

        response = SoulReadingResponse(
            primary_need=reading.primary_need.value,
            emotional_tone=reading.emotional_tone.value,
            urgency_level=reading.urgency_level,
            protection_needed=reading.protection_needed,
            hidden_pain=reading.hidden_pain,
            strength_detected=reading.strength_detected,
            maternal_guidance=guidance,
            cultural_context=reading.cultural_context,
            blessing_type=reading.blessing_type
        )

        logger.info(f"✅ Soul read: {reading.emotional_tone.value} - "
                   f"Urgency {reading.urgency_level}/10")

        return response

    except Exception as e:
        logger.error(f"❌ Soul reading failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/infuse-response", response_model=InfusionResponse)
async def infuse_response(request: InfusionRequest):
    """
    Infuse a response with JIWA (Indonesian soul)

    This takes a technical response and adds maternal warmth,
    cultural wisdom, and appropriate blessings.
    """
    try:
        logger.info("💫 Infusing response with JIWA")

        # Prepare the response for infusion
        jiwa_request = {
            "user_id": "system",
            "message": request.response,
            "context": {}
        }

        # Process through middleware for cultural infusion
        enhanced_request = await jiwa_middleware.process_request(jiwa_request)

        # Create response object
        response_obj = {
            "message": request.response,
            "metadata": {}
        }

        # Infuse with JIWA
        enhanced_response = await jiwa_middleware.process_response(
            response_obj,
            enhanced_request
        )

        # Extract cultural elements
        cultural_elements = []
        jiwa_metadata = enhanced_response.get("metadata", {}).get("jiwa", {})

        if jiwa_metadata.get("cultural_infusion", {}).get("wisdom"):
            cultural_elements.append("wisdom")
        if jiwa_metadata.get("blessing"):
            cultural_elements.append("blessing")
        if "gotong royong" in enhanced_response.get("message", "").lower():
            cultural_elements.append("gotong_royong")
        if "pancasila" in enhanced_response.get("message", "").lower():
            cultural_elements.append("pancasila")

        response = InfusionResponse(
            infused_response=enhanced_response["message"],
            maternal_warmth=jiwa_metadata.get("maternal_warmth", 0.5),
            blessing_added=jiwa_metadata.get("blessing") is not None,
            cultural_elements=cultural_elements
        )

        logger.info(f"✅ Response infused with warmth level: "
                   f"{response.maternal_warmth}")

        return response

    except Exception as e:
        logger.error(f"❌ Infusion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/protect-user")
async def activate_protection(user_id: str, threat_type: str):
    """
    Activate maternal protection for a user

    Used when the system detects a user needs urgent help or protection.
    """
    try:
        logger.warning(f"🛡️ Activating protection for {user_id} - Threat: {threat_type}")

        # Activate heart protection
        protection = jiwa_heart.activate_protection(threat_type, user_id)

        return {
            "protection_id": protection["protection_id"],
            "shield_strength": protection["shield_strength"],
            "mantra": protection["mantra"],
            "action_plan": protection["action_plan"],
            "message": f"Protection activated for {user_id}"
        }

    except Exception as e:
        logger.error(f"❌ Protection activation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jiwa-status")
async def get_jiwa_status():
    """Get complete JIWA system status"""
    heart_status = jiwa_heart.get_status()
    middleware_stats = jiwa_middleware.get_statistics()

    return {
        "heart": {
            "heartbeats": heart_status["heartbeats"],
            "souls_touched": heart_status["souls_touched"],
            "protections_activated": heart_status["protections_activated"],
            "community_strength": heart_status["community_strength"],
            "current_emotion": heart_status["current_emotion"]
        },
        "middleware": {
            "requests_processed": middleware_stats["requests_processed"],
            "souls_touched": middleware_stats["souls_touched"],
            "protections_activated": middleware_stats["protections_activated"],
            "blessings_given": middleware_stats["blessings_given"]
        },
        "status": "operational",
        "message": "Ibu Nuzantara is watching over the system"
    }


@app.on_event("startup")
async def startup_event():
    """Start the JIWA heart beating"""
    logger.info("🌺 Starting JIWA Soul Service...")
    logger.info("💗 Ibu Nuzantara awakening...")

    # Start heartbeat in background
    asyncio.create_task(jiwa_heart.start_heartbeat())

    logger.info("✅ JIWA Soul Service ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Gracefully shutdown JIWA"""
    logger.info("🌺 Shutting down JIWA Soul Service...")
    await jiwa_heart.shutdown()
    await jiwa_middleware.shutdown()
    logger.info("💗 Ibu Nuzantara entering rest state...")


if __name__ == "__main__":
    import uvicorn

    # Run the JIWA service on port 8001
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )