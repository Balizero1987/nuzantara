#!/usr/bin/env python3
"""
NUZANTARA-JIWA Wrapper - Integrazione completa nel sistema esistente
==================================================================

Questo modulo wrappa il sistema NUZANTARA esistente con JIWA,
trasformandolo in un sistema con anima indonesiana che protegge e guida.

Usage per integrare JIWA nel sistema NUZANTARA:

1. Importa questo modulo in qualsiasi parte del sistema
2. Chiama `integrate_jiwa_into_nuzantara()` all'avvio
3. Usa `jiwa_enhanced_*` per tutte le operazioni principali

"""

import asyncio
import sys
import os
import logging
from typing import Dict, Any, Optional, Callable, Union
from datetime import datetime
import json

# Setup paths
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from jiwa_integration import (
    activate_jiwa_system, 
    get_jiwa_system, 
    jiwa_process, 
    jiwa_transform,
    shutdown_jiwa_system
)

logger = logging.getLogger("NUZANTARA-JIWA")


class NuzantaraJiwaWrapper:
    """
    Wrapper principale che integra JIWA in tutto il sistema NUZANTARA
    """
    
    def __init__(self):
        self.jiwa_system = None
        self.integration_active = False
        self.wrapped_functions = {}
        self.performance_stats = {
            "total_requests": 0,
            "jiwa_enhanced_requests": 0,
            "average_response_time": 0,
            "user_satisfaction_boost": 0,
            "cultural_wisdom_applications": 0
        }
    
    async def initialize(self):
        """Inizializza l'integrazione JIWA per NUZANTARA"""
        try:
            logger.info("🌺 Initializing JIWA integration for NUZANTARA system...")
            
            # Attiva JIWA
            self.jiwa_system = await activate_jiwa_system()
            self.integration_active = True
            
            logger.info("✨ NUZANTARA-JIWA integration complete!")
            logger.info("   System now enhanced with Indonesian soul and protection")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to integrate JIWA with NUZANTARA: {e}")
            return False
    
    async def enhance_query_processing(self, 
                                     query: str, 
                                     user_id: str = "anonymous",
                                     context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Processa qualsiasi query del sistema NUZANTARA con JIWA
        
        Questo è il punto di ingresso principale per tutte le query utente.
        Sostituisce la normale elaborazione con una versione potenziata da JIWA.
        """
        start_time = datetime.now()
        self.performance_stats["total_requests"] += 1
        
        if not self.integration_active:
            logger.warning("JIWA not active - processing query without enhancement")
            return {"query": query, "enhanced": False, "timestamp": start_time.isoformat()}
        
        try:
            # Processa con JIWA
            enriched_request = await jiwa_process(query, user_id, context)
            
            self.performance_stats["jiwa_enhanced_requests"] += 1
            
            # Analizza se è stata applicata saggezza culturale
            jiwa_context = enriched_request.get("jiwa_context", {})
            soul_reading = jiwa_context.get("soul_reading")
            
            if soul_reading and soul_reading.cultural_markers:
                self.performance_stats["cultural_wisdom_applications"] += 1
            
            # Calcola tempo di risposta
            response_time = (datetime.now() - start_time).total_seconds()
            self._update_average_response_time(response_time)
            
            logger.debug(f"Enhanced query processing for user {user_id} completed in {response_time:.3f}s")
            
            return enriched_request
            
        except Exception as e:
            logger.error(f"Error in JIWA-enhanced query processing: {e}")
            return {"query": query, "enhanced": False, "error": str(e)}
    
    async def enhance_response_generation(self, 
                                        response: Any, 
                                        enriched_request: Dict[str, Any]) -> Any:
        """
        Trasforma qualsiasi risposta del sistema con il calore di Ibu Nuzantara
        """
        if not self.integration_active:
            return response
        
        try:
            # Trasforma con JIWA
            humanized_response = await jiwa_transform(response, enriched_request)
            
            # Incrementa soddisfazione utente se è stata data protezione o supporto
            if isinstance(humanized_response, dict):
                if "protection" in humanized_response or "emotional_support" in humanized_response:
                    self.performance_stats["user_satisfaction_boost"] += 1
            
            return humanized_response
            
        except Exception as e:
            logger.error(f"Error in JIWA response enhancement: {e}")
            return response
    
    async def end_to_end_enhancement(self, 
                                   query: str,
                                   original_response_generator: Callable,
                                   user_id: str = "anonymous",
                                   context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Enhancement end-to-end per qualsiasi flusso NUZANTARA
        
        Args:
            query: Query dell'utente
            original_response_generator: Funzione che genera la risposta originale
            user_id: ID utente
            context: Contesto aggiuntivo
            
        Returns:
            Dict con risposta completamente processata da JIWA
        """
        # 1. Enhanced query processing
        enriched_request = await self.enhance_query_processing(query, user_id, context)
        
        # 2. Genera risposta originale (può essere async o sync)
        if asyncio.iscoroutinefunction(original_response_generator):
            original_response = await original_response_generator(enriched_request)
        else:
            original_response = original_response_generator(enriched_request)
        
        # 3. Enhanced response generation
        humanized_response = await self.enhance_response_generation(original_response, enriched_request)
        
        return {
            "original_query": query,
            "enriched_request": enriched_request,
            "original_response": original_response,
            "humanized_response": humanized_response,
            "nuzantara_jiwa_metadata": {
                "processing_complete": True,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "soul_signature": self.jiwa_system.heart.state.soul_signature if self.jiwa_system else None
            }
        }
    
    def wrap_nuzantara_function(self, func: Callable, function_name: str = None) -> Callable:
        """
        Wrappa qualsiasi funzione NUZANTARA con JIWA
        
        Questo può essere utilizzato per wrappare:
        - API endpoints
        - Query processors  
        - Response generators
        - Business logic functions
        """
        name = function_name or func.__name__
        
        async def jiwa_wrapped_function(*args, **kwargs):
            # Estrai parametri principali
            query = None
            user_id = kwargs.get('user_id', 'anonymous')
            
            # Cerca query nei parametri
            if args:
                if isinstance(args[0], str):
                    query = args[0]
                elif isinstance(args[0], dict) and 'query' in args[0]:
                    query = args[0]['query']
            
            if not query:
                query = kwargs.get('query', kwargs.get('message', f"Function call: {name}"))
            
            # Se abbiamo una query, usa il processo end-to-end
            if query and isinstance(query, str):
                async def response_generator(enriched_req):
                    # Modifica args[0] se è la query
                    if args and isinstance(args[0], str):
                        new_args = (enriched_req,) + args[1:]
                    else:
                        new_args = args
                    
                    # Aggiungi enriched_request ai kwargs
                    new_kwargs = {**kwargs, 'jiwa_enriched_request': enriched_req}
                    
                    # Chiama funzione originale
                    if asyncio.iscoroutinefunction(func):
                        return await func(*new_args, **new_kwargs)
                    else:
                        return func(*new_args, **new_kwargs)
                
                return await self.end_to_end_enhancement(query, response_generator, user_id)
            
            else:
                # Chiamata diretta se non c'è query
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)
        
        # Salva riferimento alla funzione wrappata
        self.wrapped_functions[name] = {
            'original': func,
            'wrapped': jiwa_wrapped_function,
            'wrapped_at': datetime.now().isoformat()
        }
        
        logger.info(f"🌺 Wrapped function '{name}' with JIWA enhancement")
        
        return jiwa_wrapped_function
    
    def create_nuzantara_api_wrapper(self):
        """
        Crea un wrapper per API NUZANTARA (FastAPI/Flask/etc.)
        """
        async def jiwa_api_middleware(request, response_generator):
            """
            Middleware universale per API che integra JIWA
            """
            # Estrai dati dalla richiesta
            query = str(request.get('path', request.get('url', '')))
            user_id = request.get('user_id', request.get('headers', {}).get('user-id', 'anonymous'))
            context = {
                'method': request.get('method', 'GET'),
                'headers': request.get('headers', {}),
                'ip': request.get('ip', 'unknown')
            }
            
            # Processa con JIWA
            return await self.end_to_end_enhancement(query, response_generator, user_id, context)
        
        return jiwa_api_middleware
    
    async def get_integration_statistics(self) -> Dict[str, Any]:
        """Ottiene statistiche complete dell'integrazione NUZANTARA-JIWA"""
        base_stats = {
            "integration_active": self.integration_active,
            "wrapped_functions": len(self.wrapped_functions),
            "performance_stats": self.performance_stats.copy(),
            "functions_enhanced": list(self.wrapped_functions.keys())
        }
        
        if self.jiwa_system:
            jiwa_stats = await self.jiwa_system.get_system_status()
            base_stats["jiwa_system_status"] = jiwa_stats
        
        return base_stats
    
    def _update_average_response_time(self, new_time: float):
        """Aggiorna il tempo medio di risposta"""
        current_avg = self.performance_stats["average_response_time"]
        total_requests = self.performance_stats["total_requests"]
        
        if total_requests == 1:
            self.performance_stats["average_response_time"] = new_time
        else:
            # Media mobile
            self.performance_stats["average_response_time"] = (
                (current_avg * (total_requests - 1) + new_time) / total_requests
            )
    
    async def shutdown(self):
        """Spegne l'integrazione NUZANTARA-JIWA"""
        if self.integration_active:
            logger.info("🌙 Shutting down NUZANTARA-JIWA integration...")
            
            # Stats finali
            stats = await self.get_integration_statistics()
            logger.info(f"📊 Final Integration Statistics:")
            logger.info(f"   Total Requests: {stats['performance_stats']['total_requests']:,}")
            logger.info(f"   JIWA Enhanced: {stats['performance_stats']['jiwa_enhanced_requests']:,}")
            logger.info(f"   Functions Wrapped: {stats['wrapped_functions']}")
            logger.info(f"   User Satisfaction Boost: {stats['performance_stats']['user_satisfaction_boost']:,}")
            
            await shutdown_jiwa_system()
            self.integration_active = False
            
            logger.info("🌺 NUZANTARA-JIWA integration shutdown complete. Terima kasih! 🙏")


# Global wrapper instance
_nuzantara_jiwa_wrapper: Optional[NuzantaraJiwaWrapper] = None


async def integrate_jiwa_into_nuzantara() -> NuzantaraJiwaWrapper:
    """
    Funzione principale per integrare JIWA nel sistema NUZANTARA
    
    Chiamare questa funzione all'avvio del sistema per attivare JIWA
    """
    global _nuzantara_jiwa_wrapper
    
    if _nuzantara_jiwa_wrapper is None or not _nuzantara_jiwa_wrapper.integration_active:
        _nuzantara_jiwa_wrapper = NuzantaraJiwaWrapper()
        success = await _nuzantara_jiwa_wrapper.initialize()
        if not success:
            raise RuntimeError("Failed to integrate JIWA into NUZANTARA")
    
    return _nuzantara_jiwa_wrapper


def get_nuzantara_jiwa_wrapper() -> Optional[NuzantaraJiwaWrapper]:
    """Ottiene l'istanza del wrapper NUZANTARA-JIWA"""
    global _nuzantara_jiwa_wrapper
    return _nuzantara_jiwa_wrapper if _nuzantara_jiwa_wrapper and _nuzantara_jiwa_wrapper.integration_active else None


# Decorators di convenienza per il sistema NUZANTARA

def jiwa_enhanced(func: Callable) -> Callable:
    """
    Decorator per migliorare qualsiasi funzione NUZANTARA con JIWA
    
    Usage:
        @jiwa_enhanced
        async def my_nuzantara_function(query, user_id):
            return response
    """
    async def wrapper(*args, **kwargs):
        jiwa_wrapper = get_nuzantara_jiwa_wrapper()
        if jiwa_wrapper is None:
            jiwa_wrapper = await integrate_jiwa_into_nuzantara()
        
        enhanced_func = jiwa_wrapper.wrap_nuzantara_function(func)
        return await enhanced_func(*args, **kwargs)
    
    return wrapper


def jiwa_api_endpoint(func: Callable) -> Callable:
    """
    Decorator specifico per endpoint API NUZANTARA
    
    Usage:
        @jiwa_api_endpoint
        async def api_visa_info(request):
            return response
    """
    async def wrapper(request, *args, **kwargs):
        jiwa_wrapper = get_nuzantara_jiwa_wrapper()
        if jiwa_wrapper is None:
            jiwa_wrapper = await integrate_jiwa_into_nuzantara()
        
        # Estrai query dalla richiesta
        query = request.get('query', request.get('path', str(request)))
        user_id = request.get('user_id', 'anonymous')
        
        async def response_generator(enriched_req):
            # Aggiungi enriched request alla richiesta originale
            enhanced_request = {**request, 'jiwa_context': enriched_req.get('jiwa_context')}
            return await func(enhanced_request, *args, **kwargs)
        
        result = await jiwa_wrapper.end_to_end_enhancement(query, response_generator, user_id)
        return result['humanized_response']
    
    return wrapper


# Funzioni di utilità per integrazione rapida

async def jiwa_enhanced_query(query: str, user_id: str = "anonymous") -> Dict[str, Any]:
    """Processa una query con JIWA (auto-inizializza se necessario)"""
    wrapper = get_nuzantara_jiwa_wrapper()
    if wrapper is None:
        wrapper = await integrate_jiwa_into_nuzantara()
    
    return await wrapper.enhance_query_processing(query, user_id)


async def jiwa_enhanced_response(response: Any, enriched_request: Dict[str, Any]) -> Any:
    """Trasforma una risposta con JIWA"""
    wrapper = get_nuzantara_jiwa_wrapper()
    if wrapper is None:
        return response
    
    return await wrapper.enhance_response_generation(response, enriched_request)


# Sistema di monitoraggio per NUZANTARA-JIWA

class NuzantaraJiwaMonitor:
    """Monitor per le prestazioni dell'integrazione JIWA"""
    
    @staticmethod
    async def get_system_health() -> Dict[str, Any]:
        """Ottiene lo stato di salute dell'integrazione"""
        wrapper = get_nuzantara_jiwa_wrapper()
        if not wrapper:
            return {"status": "inactive", "health": "unknown"}
        
        stats = await wrapper.get_integration_statistics()
        
        # Calcola indicatori di salute
        total_requests = stats["performance_stats"]["total_requests"]
        enhanced_requests = stats["performance_stats"]["jiwa_enhanced_requests"]
        
        enhancement_rate = (enhanced_requests / total_requests * 100) if total_requests > 0 else 0
        avg_response_time = stats["performance_stats"]["average_response_time"]
        
        health_score = min(100, enhancement_rate + (50 if avg_response_time < 1.0 else 0))
        
        return {
            "status": "active",
            "health_score": health_score,
            "enhancement_rate": f"{enhancement_rate:.1f}%",
            "average_response_time": f"{avg_response_time:.3f}s",
            "total_functions_enhanced": stats["wrapped_functions"],
            "user_satisfaction_boost": stats["performance_stats"]["user_satisfaction_boost"],
            "jiwa_system_active": stats.get("jiwa_system_status", {}).get("status") == "active",
            "recommendation": "Sistema JIWA operativo e performante" if health_score > 80 else "Considerare ottimizzazioni"
        }


# Demo e testing

async def demo_nuzantara_jiwa_integration():
    """Demo completa dell'integrazione NUZANTARA-JIWA"""
    print("🌺 Demo Integrazione NUZANTARA-JIWA")
    print("=" * 60)
    
    # Integra JIWA
    wrapper = await integrate_jiwa_into_nuzantara()
    
    # Simula varie funzioni NUZANTARA
    @jiwa_enhanced
    async def visa_info_service(query, user_id="anonymous"):
        return f"Visa information for: {query}"
    
    @jiwa_enhanced  
    async def business_permit_service(query, user_id="anonymous"):
        return f"Business permit help: {query}"
    
    @jiwa_api_endpoint
    async def api_general_help(request):
        return {"message": f"API response for: {request.get('query', 'unknown')}"}
    
    # Test delle funzioni
    test_cases = [
        ("Help with tourist visa", "visa_info_service"),
        ("URGENT: My permit application failed!", "business_permit_service"),
        ("Someone wants money for permit processing", "api_general_help")
    ]
    
    for query, service_type in test_cases:
        print(f"\n🔍 Testing {service_type}: {query[:30]}...")
        
        if service_type == "visa_info_service":
            result = await visa_info_service(query, "test_user")
        elif service_type == "business_permit_service":
            result = await business_permit_service(query, "test_user") 
        else:
            result = await api_general_help({"query": query, "user_id": "test_user"})
        
        print(f"   Result type: {type(result).__name__}")
        if isinstance(result, dict) and "humanized_response" in result:
            humanized = result["humanized_response"]
            if isinstance(humanized, dict) and "warmth_message" in humanized:
                print(f"   💝 Warmth: {humanized['warmth_message']}")
    
    # Health check
    health = await NuzantaraJiwaMonitor.get_system_health()
    print(f"\n🏥 System Health: {health['health_score']}/100")
    print(f"   Enhancement Rate: {health['enhancement_rate']}")
    print(f"   Avg Response Time: {health['average_response_time']}")
    
    await wrapper.shutdown()


if __name__ == "__main__":
    asyncio.run(demo_nuzantara_jiwa_integration())