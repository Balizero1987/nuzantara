"""
Router Integration - Integra JIWA con il sistema di routing esistente
Trasforma il router freddo in un sistema con anima
"""

import asyncio
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import logging

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from middleware.jiwa_middleware import JiwaMiddleware

logger = logging.getLogger(__name__)

class JiwaRouterIntegration:
    """
    Integra JIWA con qualsiasi sistema di routing esistente
    Può essere applicato a intelligent_router.py o qualsiasi altro router
    """

    def __init__(self, original_router: Optional[Any] = None):
        self.original_router = original_router
        self.jiwa_middleware = JiwaMiddleware()
        self.integration_active = False
        self.request_count = 0
        self.transformation_stats = {
            "cold_requests": 0,
            "humanized_responses": 0,
            "protection_interventions": 0,
            "emotional_support_given": 0
        }

    async def initialize(self):
        """Inizializza l'integrazione JIWA"""
        await self.jiwa_middleware.activate()
        self.integration_active = True
        logger.info("🌺 JIWA Router Integration initialized - Breathing soul into the system")

    def wrap_router(self, router_class: type) -> type:
        """
        Wrappa una classe router esistente con JIWA
        """
        original_route_method = router_class.route if hasattr(router_class, 'route') else None
        original_process_method = router_class.process if hasattr(router_class, 'process') else None

        class JiwaInfusedRouter(router_class):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.jiwa_integration = JiwaRouterIntegration(self)

            async def route(self, query: str, *args, **kwargs):
                """Route con anima JIWA"""
                # Pre-process con JIWA
                request = {"query": query, "method": "route"}
                enriched_request = await self.jiwa_integration.process_with_jiwa(request)

                # Esegui routing originale
                if original_route_method:
                    result = await original_route_method(self, query, *args, **kwargs)
                else:
                    result = {"error": "No route method found"}

                # Post-process con JIWA
                humanized_result = await self.jiwa_integration.humanize_response(
                    result, enriched_request
                )

                return humanized_result

            async def process(self, request: Dict, *args, **kwargs):
                """Process con anima JIWA"""
                # Pre-process con JIWA
                enriched_request = await self.jiwa_integration.process_with_jiwa(request)

                # Esegui processing originale
                if original_process_method:
                    result = await original_process_method(self, enriched_request, *args, **kwargs)
                else:
                    result = {"error": "No process method found"}

                # Post-process con JIWA
                humanized_result = await self.jiwa_integration.humanize_response(
                    result, enriched_request
                )

                return humanized_result

        return JiwaInfusedRouter

    async def process_with_jiwa(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processa una richiesta attraverso JIWA prima del routing
        """
        self.request_count += 1
        self.transformation_stats["cold_requests"] += 1

        # Arricchisci con JIWA
        enriched = await self.jiwa_middleware.process_request(request)

        # Aggiungi metadata di integrazione
        enriched["integration_metadata"] = {
            "request_number": self.request_count,
            "jiwa_active": True,
            "timestamp": datetime.now().isoformat()
        }

        return enriched

    async def humanize_response(
        self,
        response: Any,
        enriched_request: Dict[str, Any]
    ) -> Any:
        """
        Umanizza la risposta del router con JIWA
        """
        if not isinstance(response, dict):
            response = {"result": response}

        # Trasforma con JIWA
        humanized = await self.jiwa_middleware.transform_response(
            response, enriched_request
        )

        self.transformation_stats["humanized_responses"] += 1

        # Controlla se è stata data protezione
        if "protection" in humanized:
            self.transformation_stats["protection_interventions"] += 1

        # Controlla se è stato dato supporto emotivo
        if "emotional_support" in humanized:
            self.transformation_stats["emotional_support_given"] += 1

        return humanized

    def create_jiwa_enhanced_route_handler(
        self,
        original_handler: Callable
    ) -> Callable:
        """
        Crea un handler di route potenziato con JIWA
        """
        async def enhanced_handler(request: Dict, *args, **kwargs):
            # Pre-process
            enriched = await self.process_with_jiwa(request)

            # Chiama handler originale
            response = await original_handler(enriched, *args, **kwargs)

            # Post-process
            humanized = await self.humanize_response(response, enriched)

            return humanized

        return enhanced_handler

    def inject_jiwa_into_existing_router(self, router_instance: Any):
        """
        Inietta JIWA in un'istanza di router esistente
        """
        # Salva metodi originali
        original_methods = {}

        # Wrappa metodi comuni
        methods_to_wrap = ['route', 'process', 'handle', 'execute']

        for method_name in methods_to_wrap:
            if hasattr(router_instance, method_name):
                original_method = getattr(router_instance, method_name)
                original_methods[method_name] = original_method

                # Crea versione JIWA-enhanced
                async def jiwa_enhanced_method(
                    *args,
                    _original=original_method,
                    _integration=self,
                    **kwargs
                ):
                    # Estrai request
                    request = args[0] if args else kwargs.get('request', {})
                    if isinstance(request, str):
                        request = {"query": request}

                    # Pre-process
                    enriched = await _integration.process_with_jiwa(request)

                    # Chiama metodo originale
                    if asyncio.iscoroutinefunction(_original):
                        result = await _original(*args, **kwargs)
                    else:
                        result = _original(*args, **kwargs)

                    # Post-process
                    humanized = await _integration.humanize_response(result, enriched)

                    return humanized

                # Sostituisci metodo
                setattr(router_instance, method_name, jiwa_enhanced_method)

        # Salva riferimento ai metodi originali
        router_instance._original_methods = original_methods
        router_instance._jiwa_integration = self

        logger.info(f"JIWA injected into router - {len(original_methods)} methods enhanced")

    def create_middleware_adapter(self) -> Callable:
        """
        Crea un adapter middleware per sistemi compatibili
        """
        async def jiwa_middleware_adapter(request, next_handler):
            # Pre-process con JIWA
            enriched = await self.process_with_jiwa(request)

            # Chiama next handler
            response = await next_handler(enriched)

            # Post-process con JIWA
            humanized = await self.humanize_response(response, enriched)

            return humanized

        return jiwa_middleware_adapter

    async def get_integration_stats(self) -> Dict[str, Any]:
        """
        Ottieni statistiche dell'integrazione
        """
        middleware_stats = await self.jiwa_middleware.get_middleware_stats()

        return {
            "integration_active": self.integration_active,
            "requests_processed": self.request_count,
            "transformation_stats": self.transformation_stats,
            "middleware_stats": middleware_stats,
            "jiwa_health": {
                "heart_beating": middleware_stats.get("heart_state", {}).get("heartbeat_count", 0) > 0,
                "soul_reading_active": middleware_stats.get("interactions_processed", 0) > 0,
                "protection_shields": middleware_stats.get("protection_shields_active", 0)
            }
        }

    async def shutdown(self):
        """
        Spegnimento dell'integrazione
        """
        logger.info("Shutting down JIWA Router Integration...")
        await self.jiwa_middleware.shutdown()
        self.integration_active = False
        logger.info("JIWA Router Integration shutdown complete 🌙")

# Funzioni helper per integrazione rapida

async def quick_integrate_jiwa(router_instance: Any) -> JiwaRouterIntegration:
    """
    Integrazione rapida di JIWA in qualsiasi router
    """
    integration = JiwaRouterIntegration(router_instance)
    await integration.initialize()
    integration.inject_jiwa_into_existing_router(router_instance)
    return integration

def jiwa_decorator(func: Callable) -> Callable:
    """
    Decorator per aggiungere JIWA a qualsiasi funzione di routing
    """
    integration = JiwaRouterIntegration()

    async def wrapper(*args, **kwargs):
        if not integration.integration_active:
            await integration.initialize()

        # Estrai request
        request = args[0] if args else kwargs.get('request', {})
        if isinstance(request, str):
            request = {"query": request}

        # Pre-process
        enriched = await integration.process_with_jiwa(request)

        # Chiama funzione originale
        result = await func(*args, **kwargs)

        # Post-process
        humanized = await integration.humanize_response(result, enriched)

        return humanized

    return wrapper

# Esempio di utilizzo
"""
# Per integrare con un router esistente:

from existing_system import Router
from ibu_nuzantara.integration import quick_integrate_jiwa

# Metodo 1: Integrazione rapida
router = Router()
jiwa_integration = await quick_integrate_jiwa(router)

# Metodo 2: Wrapping della classe
from ibu_nuzantara.integration import JiwaRouterIntegration
integration = JiwaRouterIntegration()
JiwaRouter = integration.wrap_router(Router)
router = JiwaRouter()

# Metodo 3: Decorator su funzioni
from ibu_nuzantara.integration import jiwa_decorator

@jiwa_decorator
async def my_route_handler(request):
    # Il tuo codice esistente
    return response
"""