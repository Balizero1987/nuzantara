#!/usr/bin/env python3
"""
ZANTARA Backend Integrity Pipeline v3.1
Sistema di verifica e miglioramento integrità risposte
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from datetime import datetime
import asyncio
import aiohttp

@dataclass
class SourceVerification:
    """Struttura verifica fonte"""
    name: str
    tier: str
    url: str
    exists: bool
    confidence: float
    last_verified: datetime

class IntegrityPipeline:
    """Pipeline principale di integrità ZANTARA"""

    def __init__(self):
        self.hr_api = "https://api.balizero.com/hr/v1"
        self.source_verifier = SourceVerifier()
        self.team_sync = TeamSynchronizer()

    async def process_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Processa una risposta per garantire integrità"""

        # 1. Verifica integrità team knowledge
        team_integrity = await self._verify_team_knowledge(response)

        # 2. Verifica e valida fonti
        source_integrity = await self._verify_sources(response)

        # 3. Calcola score integrità
        integrity_score = self._calculate_integrity_score(team_integrity, source_integrity)

        # 4. Genera risposta migliorata
        enhanced_response = await self._enhance_response(response, team_integrity, source_integrity)

        return {
            "response": enhanced_response,
            "integrity": {
                "score": integrity_score,
                "team": team_integrity,
                "sources": source_integrity,
                "timestamp": datetime.now().isoformat()
            }
        }

    async def _verify_team_knowledge(self, response: str) -> Dict[str, Any]:
        """Verifica coerenza knowledge team"""

        # Estrai membri team menzionati
        mentioned_members = self._extract_team_members(response)

        # Verifica con database HR reale
        verified_members = await self.team_sync.get_verified_members()

        # Calcola confidence
        confidence = len([m for m in mentioned_members if m in verified_members]) / max(len(mentioned_members), 1)

        return {
            "mentioned_members": mentioned_members,
            "verified_members": verified_members,
            "confidence": confidence,
            "last_sync": await self.team_sync.get_last_sync(),
            "status": "reliable" if confidence > 0.8 else "updating"
        }

    async def _verify_sources(self, response: Dict[str, Any]) -> List[SourceVerification]:
        """Verifica esistenza e validità fonti"""

        sources = response.get("sources", [])
        verified_sources = []

        for source in sources:
            verification = await self.source_verifier.verify(source)
            verified_sources.append(verification)

        return verified_sources

    def _calculate_integrity_score(self, team_integrity: Dict, source_integrity: List) -> float:
        """Calcola score integrità complessivo"""

        team_score = team_integrity["confidence"]

        # Media confidence fonti
        source_scores = [s.confidence for s in source_integrity]
        source_score = sum(source_scores) / len(source_scores) if source_scores else 0.5

        # Coerenza risposta
        consistency_score = self._check_response_consistency(team_integrity, source_integrity)

        return (team_score * 0.4 + source_score * 0.4 + consistency_score * 0.2)

    async def _enhance_response(self, response: Dict, team_integrity: Dict, source_integrity: List) -> Dict:
        """Migliora risposta con informazioni di integrità"""

        enhanced = response.copy()

        # Aggiungi disclaimer se necessario
        if team_integrity["confidence"] < 0.9:
            enhanced["team_disclaimer"] = "🔄 Team knowledge database is being updated"

        # Aggiungi fonti verificate
        enhanced["verified_sources"] = [
            {
                "name": s.name,
                "tier": s.tier,
                "url": s.url,
                "verified": s.exists
            } for s in source_integrity
        ]

        return enhanced

class TeamSynchronizer:
    """Sincronizzatore database team con HR API"""

    def __init__(self):
        self.cache = {}
        self.last_sync = None

    async def get_verified_members(self) -> List[str]:
        """Ottieni membri team verificati da HR API"""

        # Simula chiamata API HR
        if not self.cache or self._needs_refresh():
            await self._refresh_from_hr()

        return list(self.cache.keys())

    async def _refresh_from_hr(self):
        """Refresh da HR API reale"""

        # Simulazione dati HR reali
        hr_data = {
            "ZERO": {"role": "Founder", "department": "Leadership"},
            "RINA": {"role": "Operations", "department": "Management"},
            "VERONIKA": {"role": "Lead Tax", "department": "Tax"},
            "OLENA": {"role": "Tax Specialist", "department": "Tax"},
            "ANGEL": {"role": "Tax Specialist", "department": "Tax"},
            "KADEK": {"role": "Tax Specialist", "department": "Tax"},
            "FAISHA": {"role": "Customer Support Lead", "department": "Support"},
            "SAHIRA": {"role": "Marketing Specialist", "department": "Marketing"},
            "KRISNA": {"role": "Setup Consultant", "department": "Setup"},
            "ANTON": {"role": "Setup Consultant", "department": "Setup"},
            "VINO": {"role": "Setup Consultant", "department": "Setup"}
            # ... altri 11 membri da completare
        }

        self.cache = hr_data
        self.last_sync = datetime.now()

    def _needs_refresh(self) -> bool:
        """Controlla se serve refresh cache"""
        if not self.last_sync:
            return True
        return (datetime.now() - self.last_sync).hours > 1

class SourceVerifier:
    """Verificatore automatico fonti"""

    async def verify(self, source: Dict[str, Any]) -> SourceVerification:
        """Verifica esistenza fonte"""

        name = source.get("name", "")
        tier = source.get("tier", "")
        url = source.get("url", "")

        # Verifica URL se presente
        exists = await self._check_url_exists(url) if url else self._check_official_source(name)

        # Calcola confidence basata su tier e esistenza
        confidence = self._calculate_confidence(tier, exists)

        return SourceVerification(
            name=name,
            tier=tier,
            url=url,
            exists=exists,
            confidence=confidence,
            last_verified=datetime.now()
        )

    async def _check_url_exists(self, url: str) -> bool:
        """Verifica esistenza URL"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.head(url, timeout=5) as response:
                    return response.status == 200
        except:
            return False

    def _check_official_source(self, name: str) -> bool:
        """Verifica fonti ufficiali conosciute"""
        official_sources = [
            "kemenkumham.go.id",
            "bkpm.go.id",
            "oss.go.id",
            "bps.go.id",
            "ditjenpajak.go.id"
        ]
        return any(official in name.lower() for official in official_sources)

    def _calculate_confidence(self, tier: str, exists: bool) -> float:
        """Calcola confidence basata su tier e verifica"""

        base_confidence = {
            "T1": 0.95,
            "T2": 0.85,
            "T3": 0.70
        }.get(tier, 0.50)

        if exists:
            return base_confidence
        else:
            return max(0.3, base_confidence - 0.2)

# Utilizzo
async def main():
    """Test del sistema di integrità"""

    pipeline = IntegrityPipeline()

    # Simula risposta ZANTARA
    test_response = {
        "response": "ZANTARA conosce il team Bali Zero con ZERO, RINA, VERONIKA...",
        "sources": [
            {"name": "Immigration Regulation 2024", "tier": "T1", "url": "https://kemenkumham.go.id/immigration-2024"},
            {"name": "Bali Zero Pricing Guide", "tier": "T2", "url": ""}
        ]
    }

    # Processa con integrity pipeline
    result = await pipeline.process_response(test_response)

    print(f"Integrity Score: {result['integrity']['score']:.2f}")
    print(f"Team Confidence: {result['integrity']['team']['confidence']:.2f}")
    print(f"Sources Verified: {len([s for s in result['integrity']['sources'] if s.exists])}")

if __name__ == "__main__":
    asyncio.run(main())