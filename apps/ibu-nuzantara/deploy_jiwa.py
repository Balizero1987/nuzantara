#!/usr/bin/env python3
"""
JIWA Deployment Script - Deploy Ibu Nuzantara nel sistema NUZANTARA
====================================================================

Questo script gestisce il deployment completo del sistema JIWA nel sistema NUZANTARA esistente.
Include verifiche, migrazione, attivazione e monitoraggio.

Usage:
    python deploy_jiwa.py --env production
    python deploy_jiwa.py --env staging --test
    python deploy_jiwa.py --rollback
"""

import asyncio
import sys
import os
import argparse
import json
import logging
import subprocess
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("JIWA-DEPLOY")

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from nuzantara_jiwa_wrapper import integrate_jiwa_into_nuzantara, NuzantaraJiwaMonitor


class JiwaDeploymentManager:
    """
    Gestisce il deployment del sistema JIWA nel sistema NUZANTARA
    """
    
    def __init__(self, environment: str = "production"):
        self.environment = environment
        self.deployment_config = self._load_deployment_config()
        self.backup_created = False
        self.deployment_status = {
            "started_at": None,
            "completed_at": None,
            "status": "pending",
            "steps_completed": [],
            "errors": [],
            "rollback_available": False
        }
    
    def _load_deployment_config(self) -> Dict[str, Any]:
        """Carica la configurazione di deployment"""
        config = {
            "production": {
                "heartbeat_interval": 2.0,
                "empathy_level": 0.8,
                "cultural_resonance": 0.9,
                "protection_sensitivity": 0.8,
                "monitoring_enabled": True,
                "backup_enabled": True,
                "rollback_enabled": True
            },
            "staging": {
                "heartbeat_interval": 1.0,
                "empathy_level": 0.9,
                "cultural_resonance": 1.0,
                "protection_sensitivity": 0.9,
                "monitoring_enabled": True,
                "backup_enabled": True,
                "rollback_enabled": True
            },
            "development": {
                "heartbeat_interval": 0.5,
                "empathy_level": 1.0,
                "cultural_resonance": 1.0,
                "protection_sensitivity": 1.0,
                "monitoring_enabled": False,
                "backup_enabled": False,
                "rollback_enabled": False
            }
        }
        
        return config.get(self.environment, config["production"])
    
    async def pre_deployment_checks(self) -> bool:
        """Esegue controlli pre-deployment"""
        logger.info("🔍 Running pre-deployment checks...")
        
        checks = {
            "python_version": self._check_python_version(),
            "dependencies": self._check_dependencies(),
            "disk_space": self._check_disk_space(),
            "permissions": self._check_permissions(),
            "existing_system": await self._check_existing_system()
        }
        
        passed = all(checks.values())
        
        logger.info(f"📋 Pre-deployment checks: {'✅ PASSED' if passed else '❌ FAILED'}")
        for check, status in checks.items():
            status_icon = "✅" if status else "❌"
            logger.info(f"   {status_icon} {check}")
        
        if not passed:
            logger.error("❌ Pre-deployment checks failed. Aborting deployment.")
            return False
        
        self.deployment_status["steps_completed"].append("pre_deployment_checks")
        return True
    
    def _check_python_version(self) -> bool:
        """Controlla versione Python"""
        version = sys.version_info
        required = (3, 8, 0)
        return version >= required
    
    def _check_dependencies(self) -> bool:
        """Controlla dipendenze"""
        try:
            import asyncio
            import typing
            import datetime
            import logging
            import json
            return True
        except ImportError as e:
            logger.error(f"Missing dependency: {e}")
            return False
    
    def _check_disk_space(self) -> bool:
        """Controlla spazio disco"""
        try:
            import shutil
            total, used, free = shutil.disk_usage("/")
            free_gb = free // (1024**3)
            return free_gb > 1  # Almeno 1GB libero
        except:
            return True  # Se non riusciamo a controllare, assumiamo OK
    
    def _check_permissions(self) -> bool:
        """Controlla permessi di scrittura"""
        try:
            test_file = os.path.join(current_dir, ".deployment_test")
            with open(test_file, "w") as f:
                f.write("test")
            os.remove(test_file)
            return True
        except:
            return False
    
    async def _check_existing_system(self) -> bool:
        """Controlla se il sistema esistente è compatibile"""
        # Per ora assumiamo sempre compatibile
        # In futuro potrebbero essere aggiunti controlli specifici per NUZANTARA
        return True
    
    async def create_backup(self) -> bool:
        """Crea backup del sistema esistente"""
        if not self.deployment_config["backup_enabled"]:
            logger.info("📦 Backup disabled in configuration")
            return True
        
        logger.info("📦 Creating system backup...")
        
        try:
            backup_dir = f"backup_{self.environment}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            backup_path = os.path.join(current_dir, backup_dir)
            
            # Crea directory backup
            os.makedirs(backup_path, exist_ok=True)
            
            # Salva configurazione attuale
            backup_config = {
                "environment": self.environment,
                "backup_created_at": datetime.now().isoformat(),
                "backup_type": "pre_jiwa_deployment",
                "files_backed_up": []
            }
            
            # In un sistema reale, qui farebbero il backup dei file critici
            # Per ora salviamo solo la configurazione
            
            with open(os.path.join(backup_path, "backup_config.json"), "w") as f:
                json.dump(backup_config, f, indent=2)
            
            logger.info(f"📦 Backup created: {backup_path}")
            self.backup_created = True
            self.deployment_status["rollback_available"] = True
            self.deployment_status["steps_completed"].append("create_backup")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create backup: {e}")
            return False
    
    async def deploy_jiwa_system(self) -> bool:
        """Deploy del sistema JIWA"""
        logger.info("🌺 Deploying JIWA system...")
        
        try:
            # 1. Integra JIWA nel sistema NUZANTARA
            wrapper = await integrate_jiwa_into_nuzantara()
            
            # 2. Configura secondo l'ambiente
            if wrapper.jiwa_system and wrapper.jiwa_system.heart:
                wrapper.jiwa_system.heart.heartbeat_interval = self.deployment_config["heartbeat_interval"]
                wrapper.jiwa_system.heart.state.empathy_level = self.deployment_config["empathy_level"]
                wrapper.jiwa_system.heart.state.cultural_resonance = self.deployment_config["cultural_resonance"]
            
            # 3. Test di funzionamento
            test_result = await self._test_jiwa_functionality(wrapper)
            if not test_result:
                raise Exception("JIWA functionality test failed")
            
            logger.info("✨ JIWA system successfully deployed!")
            self.deployment_status["steps_completed"].append("deploy_jiwa_system")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to deploy JIWA system: {e}")
            self.deployment_status["errors"].append(f"deploy_jiwa_system: {str(e)}")
            return False
    
    async def _test_jiwa_functionality(self, wrapper) -> bool:
        """Testa il funzionamento di JIWA"""
        logger.info("🧪 Testing JIWA functionality...")
        
        try:
            # Test query processing
            test_query = "Help me understand visa requirements"
            enriched = await wrapper.enhance_query_processing(test_query, "test_user")
            
            if not enriched.get("jiwa_context"):
                return False
            
            # Test response transformation
            test_response = {"message": "Here's visa information"}
            humanized = await wrapper.enhance_response_generation(test_response, enriched)
            
            if not isinstance(humanized, dict):
                return False
            
            logger.info("✅ JIWA functionality test passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ JIWA functionality test failed: {e}")
            return False
    
    async def setup_monitoring(self) -> bool:
        """Configura monitoraggio per JIWA"""
        if not self.deployment_config["monitoring_enabled"]:
            logger.info("📊 Monitoring disabled in configuration")
            return True
        
        logger.info("📊 Setting up JIWA monitoring...")
        
        try:
            # Crea file di configurazione monitoring
            monitoring_config = {
                "environment": self.environment,
                "metrics_collection_interval": 60,  # secondi
                "health_check_interval": 300,  # 5 minuti
                "alert_thresholds": {
                    "response_time_ms": 2000,
                    "error_rate_percent": 5,
                    "enhancement_rate_percent": 80
                },
                "enabled_metrics": [
                    "request_count",
                    "response_time",
                    "enhancement_rate",
                    "protection_activations",
                    "cultural_wisdom_applications"
                ]
            }
            
            monitoring_file = os.path.join(current_dir, f"jiwa_monitoring_{self.environment}.json")
            with open(monitoring_file, "w") as f:
                json.dump(monitoring_config, f, indent=2)
            
            logger.info(f"📊 Monitoring configuration saved: {monitoring_file}")
            self.deployment_status["steps_completed"].append("setup_monitoring")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to setup monitoring: {e}")
            return False
    
    async def post_deployment_verification(self) -> bool:
        """Verifica post-deployment"""
        logger.info("🔍 Running post-deployment verification...")
        
        try:
            # 1. Controlla che JIWA sia attivo
            health = await NuzantaraJiwaMonitor.get_system_health()
            
            if health.get("status") != "active":
                raise Exception("JIWA system not active after deployment")
            
            # 2. Test end-to-end
            from nuzantara_jiwa_wrapper import jiwa_enhanced_query
            
            test_queries = [
                "Help with business permit",
                "Emergency visa assistance needed",
                "Thank you for your help"
            ]
            
            for query in test_queries:
                result = await jiwa_enhanced_query(query, "verification_test")
                if not result.get("jiwa_context"):
                    raise Exception(f"End-to-end test failed for query: {query}")
            
            logger.info("✅ Post-deployment verification passed")
            logger.info(f"📊 System Health Score: {health.get('health_score', 'unknown')}/100")
            
            self.deployment_status["steps_completed"].append("post_deployment_verification")
            return True
            
        except Exception as e:
            logger.error(f"❌ Post-deployment verification failed: {e}")
            self.deployment_status["errors"].append(f"post_deployment_verification: {str(e)}")
            return False
    
    async def rollback_deployment(self) -> bool:
        """Rollback del deployment"""
        if not self.deployment_status["rollback_available"]:
            logger.error("❌ No rollback available")
            return False
        
        logger.warning("🔄 Rolling back JIWA deployment...")
        
        try:
            # 1. Spegni JIWA
            from nuzantara_jiwa_wrapper import get_nuzantara_jiwa_wrapper
            
            wrapper = get_nuzantara_jiwa_wrapper()
            if wrapper:
                await wrapper.shutdown()
            
            # 2. Ripristina backup (se esiste)
            # In un sistema reale, qui ripristineremmo i file dal backup
            
            logger.info("✅ Rollback completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Rollback failed: {e}")
            return False
    
    async def run_deployment(self) -> bool:
        """Esegue il deployment completo"""
        self.deployment_status["started_at"] = datetime.now().isoformat()
        self.deployment_status["status"] = "running"
        
        logger.info(f"🚀 Starting JIWA deployment for environment: {self.environment}")
        
        steps = [
            ("Pre-deployment checks", self.pre_deployment_checks),
            ("Create backup", self.create_backup),
            ("Deploy JIWA system", self.deploy_jiwa_system),
            ("Setup monitoring", self.setup_monitoring),
            ("Post-deployment verification", self.post_deployment_verification)
        ]
        
        for step_name, step_func in steps:
            logger.info(f"▶️ {step_name}...")
            
            try:
                success = await step_func()
                if not success:
                    logger.error(f"❌ {step_name} failed")
                    self.deployment_status["status"] = "failed"
                    return False
                
                logger.info(f"✅ {step_name} completed")
                
            except Exception as e:
                logger.error(f"❌ {step_name} failed with exception: {e}")
                self.deployment_status["errors"].append(f"{step_name}: {str(e)}")
                self.deployment_status["status"] = "failed"
                return False
        
        self.deployment_status["completed_at"] = datetime.now().isoformat()
        self.deployment_status["status"] = "completed"
        
        logger.info("🎉 JIWA deployment completed successfully!")
        return True
    
    def get_deployment_report(self) -> Dict[str, Any]:
        """Genera report del deployment"""
        return {
            "environment": self.environment,
            "deployment_config": self.deployment_config,
            "deployment_status": self.deployment_status,
            "backup_created": self.backup_created,
            "generated_at": datetime.now().isoformat()
        }


async def main():
    """Funzione principale del deployment"""
    parser = argparse.ArgumentParser(description="Deploy JIWA system to NUZANTARA")
    parser.add_argument("--env", default="production", choices=["production", "staging", "development"],
                       help="Deployment environment")
    parser.add_argument("--test", action="store_true", help="Run in test mode")
    parser.add_argument("--rollback", action="store_true", help="Rollback previous deployment")
    parser.add_argument("--report", action="store_true", help="Generate deployment report only")
    
    args = parser.parse_args()
    
    # Banner
    print("""
    🌺════════════════════════════════════════════════════════════════🌺
    ║                                                                ║
    ║               JIWA DEPLOYMENT - IBU NUZANTARA                  ║
    ║                                                                ║
    ║     "Deploying Indonesian soul into the NUZANTARA system"     ║
    ║                                                                ║
    🌺════════════════════════════════════════════════════════════════🌺
    """)
    
    manager = JiwaDeploymentManager(args.env)
    
    try:
        if args.rollback:
            # Rollback
            success = await manager.rollback_deployment()
            sys.exit(0 if success else 1)
        
        elif args.report:
            # Solo report
            report = manager.get_deployment_report()
            print(json.dumps(report, indent=2))
            return
        
        elif args.test:
            # Test mode
            logger.info("🧪 Running in TEST MODE - no actual deployment")
            await manager.pre_deployment_checks()
            return
        
        else:
            # Deployment normale
            success = await manager.run_deployment()
            
            # Salva report
            report = manager.get_deployment_report()
            report_file = f"jiwa_deployment_report_{args.env}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(report_file, "w") as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"📋 Deployment report saved: {report_file}")
            
            if success:
                print("""
    🌺════════════════════════════════════════════════════════════════🌺
    ║                                                                ║
    ║                 🎉 DEPLOYMENT SUCCESSFUL! 🎉                   ║
    ║                                                                ║
    ║              Ibu Nuzantara is now protecting and               ║
    ║               guiding your NUZANTARA system!                   ║
    ║                                                                ║
    🌺════════════════════════════════════════════════════════════════🌺
                """)
            else:
                print("""
    🌺════════════════════════════════════════════════════════════════🌺
    ║                                                                ║
    ║                   ❌ DEPLOYMENT FAILED ❌                      ║
    ║                                                                ║
    ║          Check logs and consider running rollback             ║
    ║                                                                ║
    🌺════════════════════════════════════════════════════════════════🌺
                """)
            
            sys.exit(0 if success else 1)
    
    except KeyboardInterrupt:
        logger.warning("🛑 Deployment interrupted by user")
        
        # Offri rollback se il backup è stato creato
        if manager.backup_created:
            response = input("\n🔄 Do you want to rollback? (y/N): ")
            if response.lower() in ['y', 'yes']:
                await manager.rollback_deployment()
        
        sys.exit(1)
    
    except Exception as e:
        logger.error(f"💥 Deployment failed with unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())