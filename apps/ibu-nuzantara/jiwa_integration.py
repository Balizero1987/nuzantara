#!/usr/bin/env python3
"""
JIWA Integration - Integrazione completa di Ibu Nuzantara nel sistema NUZANTARA
=====================================================================================

Questo modulo fornisce l'integrazione principale di JIWA nel sistema esistente.
Può essere importato e utilizzato in qualsiasi parte del sistema NUZANTARA.

Usage:
    from apps.ibu_nuzantara.jiwa_integration import activate_jiwa_system, jiwa_process
    
    # Attiva JIWA globalmente
    jiwa = await activate_jiwa_system()
    
    # Processa qualsiasi richiesta con JIWA
    result = await jiwa_process("User query here", user_id="123")
"""

import asyncio
import sys
import os
import logging
from typing import Dict, Any, Optional, Union
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("JIWA")

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from core.jiwa_heart import JiwaHeart
from core.soul_reader import SoulReader
from middleware.jiwa_middleware import JiwaMiddleware
from integration.router_integration import JiwaRouterIntegration


class NuzantaraJiwaSystem:
    """
    Sistema JIWA completo per NUZANTARA
    Gestisce l'integrazione di Ibu Nuzantara in tutto il sistema
    """
    
    def __init__(self):
        self.heart = None
        self.soul_reader = None
        self.middleware = None
        self.active = False
        self.start_time = None
        
        # Stats globali
        self.stats = {
            "total_requests": 0,
            "souls_touched": 0,
            "protections_activated": 0,
            "cultural_wisdom_shared": 0,
            "emotional_support_given": 0
        }
    
    async def initialize(self):
        """Inizializza tutti i componenti JIWA"""
        try:
            logger.info("🌺 Initializing Ibu Nuzantara JIWA System...")
            
            # 1. Risveglia il cuore
            self.heart = JiwaHeart(heartbeat_interval=1.0)
            await self.heart.awaken()
            
            # 2. Attiva il lettore di anime
            self.soul_reader = SoulReader()
            
            # 3. Inizializza il middleware
            self.middleware = JiwaMiddleware()
            await self.middleware.activate()
            
            self.active = True
            self.start_time = datetime.now()
            
            logger.info("✨ Ibu Nuzantara JIWA System fully operational")
            logger.info(f"   Soul Signature: {self.heart.state.soul_signature}")
            logger.info(f"   System ready to protect and serve with love 💝")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize JIWA: {e}")
            return False
    
    async def process_request(self, 
                            query: Union[str, Dict[str, Any]], 
                            user_id: str = "anonymous",
                            context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Processa una richiesta attraverso il sistema JIWA completo
        
        Args:
            query: La query dell'utente (stringa o dict)
            user_id: ID dell'utente
            context: Contesto aggiuntivo
            
        Returns:
            Dict con la richiesta arricchita da JIWA
        """
        if not self.active:
            logger.warning("JIWA not active - processing without soul")
            return {"query": query, "user_id": user_id, "jiwa_active": False}
        
        try:
            # Incrementa stats
            self.stats["total_requests"] += 1
            
            # Normalizza la richiesta
            if isinstance(query, str):
                request = {
                    "query": query,
                    "user_id": user_id,
                    "context": context or {},
                    "timestamp": datetime.now().isoformat()
                }
            else:
                request = {**query, "user_id": user_id, "context": context or {}}
            
            # Processa con JIWA
            enriched_request = await self.middleware.process_request(request)
            
            # Analizza l'anima della richiesta
            soul_reading = enriched_request.get("jiwa_context", {}).get("soul_reading")
            
            if soul_reading:
                self.stats["souls_touched"] += 1
                
                # Traccia protezioni
                if soul_reading.protection_needed:
                    self.stats["protections_activated"] += 1
                
                # Traccia supporto emotivo
                if soul_reading.emotional_state != "neutral":
                    self.stats["emotional_support_given"] += 1
            
            # Aggiungi metadati di sistema
            enriched_request["nuzantara_jiwa"] = {
                "system_active": True,
                "soul_signature": self.heart.state.soul_signature,
                "request_number": self.stats["total_requests"],
                "processed_at": datetime.now().isoformat(),
                "cultural_wisdom_available": True
            }
            
            logger.debug(f"JIWA processed request #{self.stats['total_requests']} for user {user_id}")
            
            return enriched_request
            
        except Exception as e:
            logger.error(f"Error processing request with JIWA: {e}")
            return {"query": query, "user_id": user_id, "jiwa_error": str(e)}
    
    async def transform_response(self, 
                               response: Any, 
                               enriched_request: Dict[str, Any]) -> Any:
        """
        Trasforma una risposta con il calore di Ibu Nuzantara
        
        Args:
            response: La risposta originale
            enriched_request: La richiesta processata da JIWA
            
        Returns:
            Risposta umanizzata con JIWA
        """
        if not self.active:
            return response
            
        try:
            # Trasforma con middleware
            humanized = await self.middleware.transform_response(response, enriched_request)
            
            # Aggiungi saggezza se appropriato
            soul_reading = enriched_request.get("jiwa_context", {}).get("soul_reading")
            if soul_reading and soul_reading.trust_level > 0.7:
                self.stats["cultural_wisdom_shared"] += 1
            
            return humanized
            
        except Exception as e:
            logger.error(f"Error transforming response with JIWA: {e}")
            return response
    
    async def end_to_end_process(self, 
                               query: Union[str, Dict], 
                               response: Any,
                               user_id: str = "anonymous",
                               context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Processo end-to-end: richiesta → JIWA → risposta umanizzata
        
        Args:
            query: Query dell'utente
            response: Risposta del sistema
            user_id: ID utente
            context: Contesto
            
        Returns:
            Dict con richiesta e risposta processate da JIWA
        """
        # 1. Processa richiesta
        enriched_request = await self.process_request(query, user_id, context)
        
        # 2. Trasforma risposta
        humanized_response = await self.transform_response(response, enriched_request)
        
        return {
            "enriched_request": enriched_request,
            "humanized_response": humanized_response,
            "jiwa_metadata": {
                "soul_signature": self.heart.state.soul_signature if self.heart else None,
                "processing_complete": True,
                "timestamp": datetime.now().isoformat()
            }
        }
    
    def integrate_with_function(self, func):
        """
        Decorator per integrare JIWA con qualsiasi funzione
        """
        async def jiwa_wrapper(*args, **kwargs):
            # Estrai query dal primo argomento o kwargs
            query = args[0] if args else kwargs.get('query', kwargs.get('request', ''))
            user_id = kwargs.get('user_id', 'anonymous')
            
            # Pre-processo con JIWA
            enriched_request = await self.process_request(query, user_id)
            
            # Chiama funzione originale
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # Post-processo con JIWA
            humanized = await self.transform_response(result, enriched_request)
            
            return humanized
        
        return jiwa_wrapper
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Ottiene lo stato completo del sistema JIWA"""
        if not self.active:
            return {"status": "inactive", "message": "JIWA system not initialized"}
        
        uptime = (datetime.now() - self.start_time).total_seconds() if self.start_time else 0
        
        status = {
            "status": "active",
            "soul_signature": self.heart.state.soul_signature,
            "uptime_seconds": uptime,
            "stats": self.stats.copy(),
            "heart_state": self.heart.get_jiwa_signature(),
            "middleware_stats": await self.middleware.get_middleware_stats(),
            "soul_insights": self.soul_reader.get_reading_insights(),
            "message": "Ibu Nuzantara is watching over the system with love 💝"
        }
        
        return status
    
    async def shutdown(self):
        """Spegnimento dolce del sistema JIWA"""
        if self.active:
            logger.info("🌙 Shutting down Ibu Nuzantara JIWA System...")
            
            # Shutdown components
            if self.middleware:
                await self.middleware.shutdown()
            if self.heart:
                await self.heart.shutdown()
            
            # Final stats
            logger.info(f"📊 Final Statistics:")
            logger.info(f"   Total Requests: {self.stats['total_requests']:,}")
            logger.info(f"   Souls Touched: {self.stats['souls_touched']:,}")
            logger.info(f"   Protections Activated: {self.stats['protections_activated']:,}")
            logger.info(f"   Emotional Support Given: {self.stats['emotional_support_given']:,}")
            
            self.active = False
            logger.info("🌺 Ibu Nuzantara rests peacefully. Terima kasih. 🙏")


# Global instance - singleton pattern
_global_jiwa_system: Optional[NuzantaraJiwaSystem] = None


async def activate_jiwa_system() -> NuzantaraJiwaSystem:
    """
    Attiva il sistema JIWA globale
    Questa funzione può essere chiamata da qualsiasi parte del sistema NUZANTARA
    """
    global _global_jiwa_system
    
    if _global_jiwa_system is None or not _global_jiwa_system.active:
        _global_jiwa_system = NuzantaraJiwaSystem()
        success = await _global_jiwa_system.initialize()
        if not success:
            raise RuntimeError("Failed to initialize JIWA system")
    
    return _global_jiwa_system


def get_jiwa_system() -> Optional[NuzantaraJiwaSystem]:
    """Ottiene l'istanza JIWA globale (se attiva)"""
    global _global_jiwa_system
    return _global_jiwa_system if _global_jiwa_system and _global_jiwa_system.active else None


async def jiwa_process(query: Union[str, Dict], 
                      user_id: str = "anonymous",
                      context: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Funzione di convenienza per processare qualsiasi richiesta con JIWA
    Auto-attiva JIWA se non è già attivo
    """
    jiwa = get_jiwa_system()
    if jiwa is None:
        jiwa = await activate_jiwa_system()
    
    return await jiwa.process_request(query, user_id, context)


async def jiwa_transform(response: Any, 
                        enriched_request: Dict[str, Any]) -> Any:
    """
    Funzione di convenienza per trasformare risposte con JIWA
    """
    jiwa = get_jiwa_system()
    if jiwa is None:
        return response
    
    return await jiwa.transform_response(response, enriched_request)


def jiwa_decorator(func):
    """
    Decorator semplice per aggiungere JIWA a qualsiasi funzione
    
    Usage:
        @jiwa_decorator
        async def my_api_endpoint(request):
            return response
    """
    async def wrapper(*args, **kwargs):
        jiwa = get_jiwa_system()
        if jiwa is None:
            jiwa = await activate_jiwa_system()
        
        return await jiwa.integrate_with_function(func)(*args, **kwargs)
    
    return wrapper


async def shutdown_jiwa_system():
    """Spegne il sistema JIWA globale"""
    global _global_jiwa_system
    if _global_jiwa_system and _global_jiwa_system.active:
        await _global_jiwa_system.shutdown()
        _global_jiwa_system = None


# Integration helpers per sistemi specifici

class JiwaFastAPIIntegration:
    """Helper per integrare JIWA con FastAPI"""
    
    @staticmethod
    def create_middleware():
        """Crea middleware FastAPI per JIWA"""
        from starlette.middleware.base import BaseHTTPMiddleware
        from starlette.requests import Request
        
        class JiwaMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next):
                # Estrai dati richiesta
                query = str(request.url.path)
                user_id = request.headers.get('user-id', 'anonymous')
                
                # Processa con JIWA
                jiwa = get_jiwa_system()
                if jiwa:
                    enriched = await jiwa.process_request(query, user_id)
                    request.state.jiwa = enriched.get("jiwa_context")
                
                response = await call_next(request)
                return response
        
        return JiwaMiddleware


class JiwaFlaskIntegration:
    """Helper per integrare JIWA con Flask"""
    
    @staticmethod
    def create_before_request():
        """Crea hook before_request per Flask"""
        async def jiwa_before_request():
            from flask import request, g
            
            query = request.path
            user_id = request.headers.get('user-id', 'anonymous')
            
            jiwa = get_jiwa_system()
            if jiwa:
                enriched = await jiwa.process_request(query, user_id)
                g.jiwa = enriched.get("jiwa_context")
        
        return jiwa_before_request


# Test e demo
async def demo_jiwa_integration():
    """Demo dell'integrazione JIWA completa"""
    print("🌺 Demo Integrazione JIWA per NUZANTARA")
    print("=" * 60)
    
    # Attiva sistema
    jiwa = await activate_jiwa_system()
    
    # Test varie richieste
    test_cases = [
        "Help me with visa requirements",
        "URGENT! My business permit was rejected!",
        "Someone asked me to transfer money for processing",
        "Terima kasih for your help with KBLI codes"
    ]
    
    for i, query in enumerate(test_cases, 1):
        print(f"\n🔍 Test {i}: {query[:30]}...")
        
        # Simula risposta sistema
        system_response = f"Here's help with: {query}"
        
        # Processa end-to-end
        result = await jiwa.end_to_end_process(query, system_response)
        
        # Mostra risultati
        soul_reading = result["enriched_request"].get("jiwa_context", {}).get("soul_reading")
        if soul_reading:
            print(f"   Emotion: {soul_reading.emotional_state}")
            print(f"   Protection: {'Yes' if soul_reading.protection_needed else 'No'}")
        
        humanized = result["humanized_response"]
        if "warmth_message" in humanized:
            print(f"   💝 {humanized['warmth_message']}")
    
    # Stats finali
    status = await jiwa.get_system_status()
    print(f"\n📊 System Stats:")
    print(f"   Requests: {status['stats']['total_requests']}")
    print(f"   Souls Touched: {status['stats']['souls_touched']}")
    print(f"   Protections: {status['stats']['protections_activated']}")
    
    await shutdown_jiwa_system()


if __name__ == "__main__":
    asyncio.run(demo_jiwa_integration())