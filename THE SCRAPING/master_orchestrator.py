#!/usr/bin/env python3
"""
THE SCRAPING - Master Orchestrator
Runs all 3 stages in sequence: Scraping → LLAMA Processing → Editorial AI
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import logging
from typing import Optional

# Import stage modules
from stage1_scraper import IntelScraper
from stage2_llama_processor import LlamaProcessor
from stage3_editorial_ai import EditorialAI

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('./logs/orchestrator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ScrapingOrchestrator:
    """Master orchestrator for the entire scraping pipeline"""
    
    def __init__(self, anthropic_api_key: Optional[str] = None):
        self.start_time = datetime.now()
        self.logs_dir = Path("./logs")
        self.logs_dir.mkdir(exist_ok=True)
        
        # Initialize all stages
        logger.info("🚀 Initializing Scraping Orchestrator...")
        
        self.scraper = IntelScraper()
        self.llama_processor = LlamaProcessor()
        self.editorial_ai = EditorialAI(api_key=anthropic_api_key)
        
        logger.info("✅ All stages initialized successfully")
    
    async def run_full_pipeline(self, test_mode: bool = False) -> dict:
        """Run complete pipeline: Stage 1 → 2 → 3"""
        
        logger.info("=" * 80)
        logger.info("🚀 STARTING FULL PIPELINE")
        logger.info("=" * 80)
        
        results = {
            "started_at": self.start_time.isoformat(),
            "test_mode": test_mode,
            "stages": {}
        }
        
        # STAGE 1: Scraping
        logger.info("\n" + "="*80)
        logger.info("📡 STAGE 1: WEB SCRAPING")
        logger.info("="*80)
        
        try:
            if test_mode:
                stage1_result = await self.scraper.scrape_all(limit_per_category=1)
            else:
                stage1_result = await self.scraper.scrape_all()
            
            results["stages"]["stage1_scraping"] = {
                "status": "success",
                "pages_scraped": stage1_result["total_pages"],
                "duration": stage1_result["duration_seconds"]
            }
            logger.info(f"✅ Stage 1 Complete: {stage1_result['total_pages']} pages in {stage1_result['duration_seconds']:.0f}s")
            
        except Exception as e:
            logger.error(f"❌ Stage 1 Failed: {str(e)}")
            results["stages"]["stage1_scraping"] = {
                "status": "failed",
                "error": str(e)
            }
            return results
        
        # STAGE 2: LLAMA Processing
        logger.info("\n" + "="*80)
        logger.info("🤖 STAGE 2: LLAMA AI PROCESSING")
        logger.info("="*80)
        
        try:
            stage2_result = self.llama_processor.process_all()
            
            results["stages"]["stage2_llama"] = {
                "status": "success",
                "rag_documents": stage2_result["total_rag"],
                "articles_generated": stage2_result["total_articles"],
                "duration": stage2_result["duration_seconds"]
            }
            logger.info(f"✅ Stage 2 Complete: {stage2_result['total_rag']} RAG docs, {stage2_result['total_articles']} articles")
            
        except Exception as e:
            logger.error(f"❌ Stage 2 Failed: {str(e)}")
            results["stages"]["stage2_llama"] = {
                "status": "failed",
                "error": str(e)
            }
            return results
        
        # STAGE 3: Editorial AI
        logger.info("\n" + "="*80)
        logger.info("📝 STAGE 3: EDITORIAL AI REVIEW")
        logger.info("="*80)
        
        try:
            stage3_result = self.editorial_ai.process_all()
            
            results["stages"]["stage3_editorial"] = {
                "status": "success",
                "published": stage3_result["total_published"],
                "rejected": stage3_result["total_rejected"],
                "avg_quality": stage3_result["avg_quality_score"],
                "duration": stage3_result["duration_seconds"]
            }
            logger.info(f"✅ Stage 3 Complete: {stage3_result['total_published']} published, {stage3_result['total_rejected']} rejected")
            
        except Exception as e:
            logger.error(f"❌ Stage 3 Failed: {str(e)}")
            results["stages"]["stage3_editorial"] = {
                "status": "failed",
                "error": str(e)
            }
            return results
        
        # Final summary
        results["completed_at"] = datetime.now().isoformat()
        results["total_duration"] = (datetime.now() - self.start_time).total_seconds()
        results["status"] = "success"
        
        # Save summary
        summary_file = self.logs_dir / f"pipeline_summary_{self.start_time.strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info("\n" + "="*80)
        logger.info("✅ PIPELINE COMPLETE")
        logger.info("="*80)
        logger.info(f"📊 Summary saved: {summary_file}")
        logger.info(f"⏱️  Total duration: {results['total_duration']:.0f}s")
        
        return results
    
    async def run_stage_only(self, stage: int, category: Optional[str] = None):
        """Run only a specific stage"""
        
        if stage == 1:
            logger.info("📡 Running Stage 1: Scraping only")
            if category:
                result = await self.scraper.scrape_category(category)
            else:
                result = await self.scraper.scrape_all()
            return result
        
        elif stage == 2:
            logger.info("🤖 Running Stage 2: LLAMA Processing only")
            if category:
                result = self.llama_processor.process_category(category)
            else:
                result = self.llama_processor.process_all()
            return result
        
        elif stage == 3:
            logger.info("📝 Running Stage 3: Editorial AI only")
            if category:
                result = self.editorial_ai.process_category(category)
            else:
                result = self.editorial_ai.process_all()
            return result
        
        else:
            raise ValueError(f"Invalid stage: {stage}. Must be 1, 2, or 3")


async def main():
    """Main CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="THE SCRAPING - Master Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run full pipeline (all stages)
  python master_orchestrator.py --full
  
  # Test mode (1 site per category)
  python master_orchestrator.py --full --test
  
  # Run only Stage 1 (scraping)
  python master_orchestrator.py --stage 1
  
  # Run only Stage 2 for specific category
  python master_orchestrator.py --stage 2 --category immigration
  
  # Run Stage 3 with custom API key
  python master_orchestrator.py --stage 3 --api-key sk-ant-...
        """
    )
    
    parser.add_argument("--full", action="store_true", help="Run full pipeline (all 3 stages)")
    parser.add_argument("--stage", type=int, choices=[1, 2, 3], help="Run specific stage only")
    parser.add_argument("--category", "-c", help="Process specific category only")
    parser.add_argument("--test", action="store_true", help="Test mode: 1 site per category")
    parser.add_argument("--api-key", help="Anthropic API key for Stage 3")
    
    args = parser.parse_args()
    
    if not args.full and not args.stage:
        parser.print_help()
        print("\n❌ Error: Must specify either --full or --stage")
        return 1
    
    try:
        orchestrator = ScrapingOrchestrator(anthropic_api_key=args.api_key)
        
        if args.full:
            print("🚀 Running FULL PIPELINE (all 3 stages)...")
            if args.test:
                print("🧪 TEST MODE: 1 site per category")
            
            results = await orchestrator.run_full_pipeline(test_mode=args.test)
            
            print("\n" + "="*80)
            print("📊 PIPELINE RESULTS")
            print("="*80)
            
            for stage_name, stage_data in results["stages"].items():
                print(f"\n{stage_name.upper()}: {stage_data['status']}")
                if stage_data['status'] == 'success':
                    for key, value in stage_data.items():
                        if key != 'status':
                            print(f"  {key}: {value}")
            
            print(f"\n⏱️  Total duration: {results['total_duration']:.0f}s")
            print("="*80)
        
        else:
            print(f"🎯 Running Stage {args.stage} only...")
            if args.category:
                print(f"📂 Category: {args.category}")
            
            result = await orchestrator.run_stage_only(args.stage, args.category)
            print("\n✅ Stage complete!")
            print(json.dumps(result, indent=2))
        
        return 0
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {str(e)}")
        print(f"\n❌ Error: {str(e)}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
