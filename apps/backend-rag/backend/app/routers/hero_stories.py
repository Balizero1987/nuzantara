"""
Hero Stories Router

API endpoints per le storie narrative degli eroi di Zantara
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.data.hero_stories import get_hero_story, get_all_heroes, HERO_STORIES

router = APIRouter(prefix="/api/heroes", tags=["heroes"])


class HeroSummary(BaseModel):
    """Schema per il riepilogo di un eroe"""
    id: str
    hero_name: str
    title: str
    subtitle: str


class HeroStoryResponse(BaseModel):
    """Schema per la risposta completa di una storia"""
    id: str
    hero_name: str
    title: str
    subtitle: str
    image_url: Optional[str] = None
    chapter: Optional[str] = None
    story: dict
    quotes: list
    traits_narrative: Optional[dict] = None
    connections: Optional[dict] = None
    metadata: Optional[dict] = None


@router.get("/", response_model=list[HeroSummary])
async def list_heroes():
    """
    Lista tutti gli eroi disponibili con un riepilogo
    """
    heroes = get_all_heroes()
    return [
        HeroSummary(
            id=hero["id"],
            hero_name=hero["hero_name"],
            title=hero["title"],
            subtitle=hero["subtitle"]
        )
        for hero in heroes
    ]


@router.get("/{hero_id}", response_model=HeroStoryResponse)
async def get_hero(hero_id: str):
    """
    Recupera la storia completa di un eroe specifico
    """
    story = get_hero_story(hero_id)

    if not story:
        raise HTTPException(
            status_code=404,
            detail=f"Hero story not found: {hero_id}"
        )

    return HeroStoryResponse(**story)


@router.get("/{hero_id}/quotes")
async def get_hero_quotes(hero_id: str):
    """
    Recupera solo le citazioni di un eroe
    """
    story = get_hero_story(hero_id)

    if not story:
        raise HTTPException(
            status_code=404,
            detail=f"Hero not found: {hero_id}"
        )

    return {
        "hero_id": hero_id,
        "hero_name": story["hero_name"],
        "quotes": story.get("quotes", [])
    }
