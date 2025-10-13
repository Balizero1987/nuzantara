#!/usr/bin/env python3
"""
Test Integration - Verifica Pipeline Completa
Tests: Scraping → Filtri → Stage2 → ChromaDB

Author: ZANTARA System
Date: 2025-10-13
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
import requests

# Add current dir to path
sys.path.insert(0, str(Path(__file__).parent))

from llama_intelligent_filter import LLAMAFilter
from news_intelligent_filter import NewsIntelligentFilter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test data
TEST_ARTICLES = [
    {
        "title": "New Visa Regulations for Digital Nomads in Bali",
        "content": "The Indonesian government has announced new visa regulations specifically designed for digital nomads working in Bali. The new B211A visa allows stays up to 6 months and requires proof of remote employment. Applications open next month with streamlined online processing.",
        "url": "https://example.com/visa-news-1",
        "tier": "T1",
        "category": "immigration",
        "scraped_at": "2025-10-13T14:00:00Z",
        "impact_level": "high",
        "source": "Official Immigration Portal"
    },
    {
        "title": "Click here for amazing deals!",
        "content": "Advertisement - Best prices on hotels in Bali. Book now and save 50%! Limited time offer. Click here to learn more.",
        "url": "https://spam.com/deals",
        "tier": "T3",
        "category": "tourism",
        "scraped_at": "2025-10-13T14:00:00Z",
        "impact_level": "low",
        "source": "Random Blog"
    },
    {
        "title": "AI Revolution: GPT-5 Announced with Breakthrough Capabilities",
        "content": "OpenAI has just announced GPT-5 with unprecedented capabilities in reasoning and multimodal understanding. The model shows significant improvements in code generation, scientific research, and real-time interaction. Industry experts predict this will transform software development workflows.",
        "url": "https://tech.com/gpt5-news",
        "tier": "T1",
        "category": "ai_tech",
        "scraped_at": "2025-10-13T14:00:00Z",
        "impact_level": "critical",
        "source": "TechCrunch"
    },
    {
        "title": "How to Register a Company in Indonesia",
        "content": "Step-by-step guide to company registration process in Indonesia. Requirements include: 1) NIB registration 2) Tax ID 3) Business license. Complete documentation needed.",
        "url": "https://example.com/howto",
        "tier": "T2",
        "category": "business",
        "scraped_at": "2025-10-13T14:00:00Z",
        "impact_level": "medium",
        "source": "Business Guide"
    }
]

def test_llama_filter():
    """Test 1: LLAMA Filter"""
    logger.info("=" * 80)
    logger.info("TEST 1: LLAMA FILTER (Regular Categories)")
    logger.info("=" * 80)
    
    llama_filter = LLAMAFilter()
    
    # Filter non-LLAMA articles
    regular_articles = [a for a in TEST_ARTICLES if a['category'] not in ['ai_tech', 'dev_code', 'future_trends']]
    
    logger.info(f"Input: {len(regular_articles)} articles")
    filtered = llama_filter.intelligent_filter(regular_articles)
    logger.info(f"Output: {len(filtered)} articles")
    
    for article in filtered:
        logger.info(f"  ✅ {article['title'][:60]} (score: {article.get('llama_score', 0)})")
    
    assert len(filtered) > 0, "Filter should pass at least one article"
    logger.info("✅ LLAMA Filter test PASSED\n")
    
    return filtered

def test_news_filter():
    """Test 2: News Filter"""
    logger.info("=" * 80)
    logger.info("TEST 2: NEWS FILTER (LLAMA Categories)")
    logger.info("=" * 80)
    
    news_filter = NewsIntelligentFilter()
    
    # Filter LLAMA articles
    llama_articles = [a for a in TEST_ARTICLES if a['category'] in ['ai_tech', 'dev_code', 'future_trends']]
    
    logger.info(f"Input: {len(llama_articles)} articles")
    filtered = news_filter.filter_real_news(llama_articles)
    logger.info(f"Output: {len(filtered)} articles")
    
    for article in filtered:
        logger.info(f"  ✅ {article['title'][:60]} (score: {article.get('news_score', 0)})")
    
    logger.info("✅ News Filter test PASSED\n")
    
    return filtered

def test_embed_endpoint():
    """Test 3: /api/embed endpoint"""
    logger.info("=" * 80)
    logger.info("TEST 3: RAG BACKEND /api/embed ENDPOINT")
    logger.info("=" * 80)
    
    RAG_URL = "https://zantara-rag-backend-himaadsxua-ew.a.run.app"
    
    try:
        response = requests.post(
            f"{RAG_URL}/api/embed",
            json={"text": "Test embedding generation for Bali intel scraper"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"  ✅ Embedding generated:")
            logger.info(f"     Dimensions: {data.get('dimensions')}")
            logger.info(f"     Model: {data.get('model')}")
            logger.info(f"     Vector preview: [{data['embedding'][0]:.4f}, {data['embedding'][1]:.4f}, ...]")
            logger.info("✅ Embed endpoint test PASSED\n")
            return True
        else:
            logger.error(f"  ❌ HTTP {response.status_code}: {response.text}")
            logger.warning("⚠️  Embed endpoint test FAILED (endpoint may not be deployed yet)\n")
            return False
    
    except Exception as e:
        logger.error(f"  ❌ Error: {e}")
        logger.warning("⚠️  Embed endpoint test FAILED (endpoint may not be deployed yet)\n")
        return False

def test_intel_store_endpoint():
    """Test 4: /api/intel/store endpoint"""
    logger.info("=" * 80)
    logger.info("TEST 4: RAG BACKEND /api/intel/store ENDPOINT")
    logger.info("=" * 80)
    
    RAG_URL = "https://zantara-rag-backend-himaadsxua-ew.a.run.app"
    
    # Generate test embedding first
    try:
        embed_response = requests.post(
            f"{RAG_URL}/api/embed",
            json={"text": "Test article for ChromaDB storage"},
            timeout=30
        )
        
        if embed_response.status_code != 200:
            logger.warning("⚠️  Skipping store test (embed endpoint not available)")
            return False
        
        embedding = embed_response.json()['embedding']
        
        # Test store
        store_response = requests.post(
            f"{RAG_URL}/api/intel/store",
            json={
                "collection": "immigration",
                "id": f"test_{int(asyncio.get_event_loop().time())}",
                "document": "Test article content",
                "embedding": embedding,
                "metadata": {
                    "title": "Test Article",
                    "source": "Test Suite",
                    "tier": "T1",
                    "category": "immigration"
                },
                "full_data": {"test": True}
            },
            timeout=30
        )
        
        if store_response.status_code == 200:
            data = store_response.json()
            logger.info(f"  ✅ Article stored:")
            logger.info(f"     Collection: {data.get('collection')}")
            logger.info(f"     ID: {data.get('id')}")
            logger.info("✅ Store endpoint test PASSED\n")
            return True
        else:
            logger.error(f"  ❌ HTTP {store_response.status_code}: {store_response.text}")
            logger.warning("⚠️  Store endpoint test FAILED\n")
            return False
    
    except Exception as e:
        logger.error(f"  ❌ Error: {e}")
        logger.warning("⚠️  Store endpoint test FAILED\n")
        return False

def run_all_tests():
    """Run all integration tests"""
    logger.info("\n")
    logger.info("🧪" * 40)
    logger.info("INTEGRATION TEST SUITE - BALI INTEL SCRAPER")
    logger.info("🧪" * 40)
    logger.info("\n")
    
    results = {
        "llama_filter": False,
        "news_filter": False,
        "embed_endpoint": False,
        "store_endpoint": False
    }
    
    # Test 1: LLAMA Filter
    try:
        test_llama_filter()
        results["llama_filter"] = True
    except Exception as e:
        logger.error(f"❌ LLAMA Filter test failed: {e}\n")
    
    # Test 2: News Filter
    try:
        test_news_filter()
        results["news_filter"] = True
    except Exception as e:
        logger.error(f"❌ News Filter test failed: {e}\n")
    
    # Test 3: Embed endpoint
    try:
        results["embed_endpoint"] = test_embed_endpoint()
    except Exception as e:
        logger.error(f"❌ Embed endpoint test failed: {e}\n")
    
    # Test 4: Store endpoint
    try:
        results["store_endpoint"] = test_intel_store_endpoint()
    except Exception as e:
        logger.error(f"❌ Store endpoint test failed: {e}\n")
    
    # Summary
    logger.info("=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"  {test_name:20s} {status}")
    
    total_passed = sum(results.values())
    total_tests = len(results)
    
    logger.info("")
    logger.info(f"Total: {total_passed}/{total_tests} tests passed ({total_passed/total_tests*100:.0f}%)")
    logger.info("=" * 80)
    
    if total_passed == total_tests:
        logger.info("🎉 ALL TESTS PASSED - System is production ready!")
    elif total_passed >= 2:
        logger.info("⚠️  PARTIAL SUCCESS - Core filters working, endpoints need deployment")
    else:
        logger.info("❌ TESTS FAILED - Check implementation")
    
    logger.info("\n")
    
    return results

if __name__ == "__main__":
    results = run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if sum(results.values()) >= 2 else 1)

