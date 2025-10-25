"""
ZANTARA Memory System Test Suite
Tests the complete memory system including retrieve() and search() methods
"""

import asyncio
import logging
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Import the memory service
from backend.services.memory_service_postgres import MemoryServicePostgres, UserMemory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MemorySystemTester:
    """Test suite for ZANTARA memory system"""

    def __init__(self):
        self.memory_service = None
        self.test_results = []

    async def setup(self):
        """Initialize memory service"""
        logger.info("🚀 Setting up memory service for testing...")

        # Initialize memory service (will use DATABASE_URL from env or in-memory fallback)
        self.memory_service = MemoryServicePostgres()
        await self.memory_service.connect()

        logger.info("✅ Memory service initialized")

    async def teardown(self):
        """Clean up resources"""
        if self.memory_service:
            await self.memory_service.close()
            logger.info("✅ Memory service closed")

    def log_test_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASSED" if passed else "❌ FAILED"
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'details': details
        })
        logger.info(f"{status}: {test_name}")
        if details:
            logger.info(f"  Details: {details}")

    async def test_retrieve_method_exists(self) -> bool:
        """Test 1: Check if retrieve() method exists and is callable"""
        test_name = "retrieve() method exists"

        try:
            # Check if method exists
            assert hasattr(self.memory_service, 'retrieve'), "retrieve() method not found"
            assert callable(self.memory_service.retrieve), "retrieve() is not callable"

            # Call the method with test user
            result = await self.memory_service.retrieve(user_id="test@example.com")

            # Validate response structure
            required_keys = {'user_id', 'profile_facts', 'summary', 'counters', 'has_data'}
            assert isinstance(result, dict), f"retrieve() should return dict, got {type(result)}"
            assert required_keys.issubset(result.keys()), f"Missing keys: {required_keys - result.keys()}"

            # Validate data types
            assert isinstance(result['profile_facts'], list), "profile_facts should be a list"
            assert isinstance(result['summary'], str), "summary should be a string"
            assert isinstance(result['counters'], dict), "counters should be a dict"
            assert isinstance(result['has_data'], bool), "has_data should be a boolean"

            self.log_test_result(test_name, True, f"Method works, returned: {result}")
            return True

        except Exception as e:
            self.log_test_result(test_name, False, str(e))
            return False

    async def test_retrieve_with_category_filter(self) -> bool:
        """Test 2: Check if retrieve() filters by category correctly"""
        test_name = "retrieve() with category filter"

        try:
            # First add some test data
            test_user = "category_test@example.com"

            # Add facts with different categories
            await self.memory_service.add_fact(test_user, "Visa preference: E28A Investor KITAS")
            await self.memory_service.add_fact(test_user, "Business type: PT PMA for e-commerce")
            await self.memory_service.add_fact(test_user, "Location preference: Canggu area")
            await self.memory_service.add_fact(test_user, "Visa timeline: 3 months")

            # Test category filtering
            visa_result = await self.memory_service.retrieve(test_user, category="visa")
            business_result = await self.memory_service.retrieve(test_user, category="business")
            all_result = await self.memory_service.retrieve(test_user)

            # Validate filtering
            visa_facts = visa_result['profile_facts']
            business_facts = business_result['profile_facts']
            all_facts = all_result['profile_facts']

            assert len(visa_facts) == 2, f"Should find 2 visa-related facts, found {len(visa_facts)}"
            assert len(business_facts) == 1, f"Should find 1 business fact, found {len(business_facts)}"
            assert len(all_facts) == 4, f"Should find all 4 facts without filter, found {len(all_facts)}"

            # Check category_filter field
            assert visa_result['category_filter'] == 'visa'
            assert business_result['category_filter'] == 'business'
            assert all_result['category_filter'] is None

            self.log_test_result(test_name, True,
                f"Category filtering works: visa={len(visa_facts)}, business={len(business_facts)}, all={len(all_facts)}")
            return True

        except Exception as e:
            self.log_test_result(test_name, False, str(e))
            return False

    async def test_search_method_exists(self) -> bool:
        """Test 3: Check if search() method exists and works"""
        test_name = "search() method exists"

        try:
            # Check if method exists
            assert hasattr(self.memory_service, 'search'), "search() method not found"
            assert callable(self.memory_service.search), "search() is not callable"

            # Call the method
            result = await self.memory_service.search(query="test", limit=5)

            # Validate response structure
            assert isinstance(result, list), f"search() should return list, got {type(result)}"

            # If results exist, validate structure
            if result:
                item = result[0]
                required_keys = {'user_id', 'fact', 'confidence', 'created_at'}
                assert required_keys.issubset(item.keys()), f"Missing keys in result: {required_keys - item.keys()}"
                assert isinstance(item['confidence'], (int, float)), "confidence should be numeric"

            self.log_test_result(test_name, True, f"Method works, returned {len(result)} results")
            return True

        except Exception as e:
            self.log_test_result(test_name, False, str(e))
            return False

    async def test_search_functionality(self) -> bool:
        """Test 4: Check if search() actually finds data"""
        test_name = "search() functionality"

        try:
            # Add test data with unique keyword
            test_user = "search_test@example.com"
            unique_keyword = f"UNIQUE_KEYWORD_{datetime.now().timestamp()}"

            await self.memory_service.add_fact(test_user, f"Test fact with {unique_keyword}")
            await self.memory_service.update_summary(test_user, f"Summary with {unique_keyword}")

            # Search for the unique keyword
            results = await self.memory_service.search(query=unique_keyword, limit=10)

            # Validate results
            assert len(results) > 0, f"Should find at least 1 result for '{unique_keyword}'"

            # Check if our test data is in results
            found_fact = False
            found_summary = False

            for result in results:
                if unique_keyword in result['fact']:
                    if '[Summary]' in result['fact']:
                        found_summary = True
                    else:
                        found_fact = True

            assert found_fact or found_summary, f"Should find the test data with '{unique_keyword}'"

            self.log_test_result(test_name, True,
                f"Search found {len(results)} results for '{unique_keyword}'")
            return True

        except Exception as e:
            self.log_test_result(test_name, False, str(e))
            return False

    async def test_error_handling(self) -> bool:
        """Test 5: Check if methods handle errors gracefully"""
        test_name = "Error handling"

        try:
            # Test retrieve with None user_id
            try:
                result = await self.memory_service.retrieve(user_id=None)
                # Should return empty structure, not crash
                assert result['has_data'] == False, "Should return has_data=False for None user"
                assert 'error' in result or result['profile_facts'] == [], "Should handle None gracefully"
            except Exception as e:
                raise AssertionError(f"retrieve() crashed on None user_id: {e}")

            # Test search with empty query
            try:
                result = await self.memory_service.search(query="", limit=5)
                # Should return empty list, not crash
                assert isinstance(result, list), "search() should return list even for empty query"
                assert len(result) == 0, "Empty query should return empty list"
            except Exception as e:
                raise AssertionError(f"search() crashed on empty query: {e}")

            # Test search with None query
            try:
                result = await self.memory_service.search(query=None, limit=5)
                assert isinstance(result, list), "search() should handle None query"
            except Exception as e:
                # This is acceptable - None might not be allowed
                pass

            self.log_test_result(test_name, True, "Methods handle errors gracefully")
            return True

        except AssertionError as e:
            self.log_test_result(test_name, False, str(e))
            return False

    async def test_zantara_tools_integration(self) -> bool:
        """Test 6: Simulate ZantaraTools calling the memory service"""
        test_name = "ZantaraTools integration simulation"

        try:
            # Simulate what ZantaraTools does
            user_id = "zantara_test@example.com"

            # Add some test memory
            await self.memory_service.add_fact(user_id, "Nome: Giovanni")
            await self.memory_service.add_fact(user_id, "Preferisce setup PT PMA")
            await self.memory_service.update_summary(user_id, "Cliente interessato a business setup")
            await self.memory_service.increment_counter(user_id, "conversations")

            # Simulate ZantaraTools._retrieve_user_memory()
            memory_data = await self.memory_service.retrieve(user_id, category=None)

            # Build response like ZantaraTools would
            tool_response = {
                "success": True,
                "data": memory_data
            }

            # Validate the integration would work
            assert tool_response['success'] == True
            assert tool_response['data']['has_data'] == True
            assert len(tool_response['data']['profile_facts']) == 2
            assert tool_response['data']['counters']['conversations'] == 1

            # Test with category filter
            visa_memory = await self.memory_service.retrieve(user_id, category="visa")
            assert 'profile_facts' in visa_memory

            self.log_test_result(test_name, True,
                f"ZantaraTools integration would work: {tool_response['data']['has_data']}")
            return True

        except Exception as e:
            self.log_test_result(test_name, False, str(e))
            return False

    async def run_all_tests(self):
        """Run all tests"""
        logger.info("\n" + "="*60)
        logger.info("🧪 ZANTARA MEMORY SYSTEM TEST SUITE")
        logger.info("="*60 + "\n")

        await self.setup()

        # Run all tests
        tests = [
            self.test_retrieve_method_exists(),
            self.test_retrieve_with_category_filter(),
            self.test_search_method_exists(),
            self.test_search_functionality(),
            self.test_error_handling(),
            self.test_zantara_tools_integration()
        ]

        # Execute all tests
        results = await asyncio.gather(*tests)

        await self.teardown()

        # Print summary
        logger.info("\n" + "="*60)
        logger.info("📊 TEST SUMMARY")
        logger.info("="*60)

        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['passed'])
        failed_tests = total_tests - passed_tests

        for result in self.test_results:
            status = "✅" if result['passed'] else "❌"
            logger.info(f"{status} {result['test']}")

        logger.info("-"*60)
        logger.info(f"Total: {total_tests} | Passed: {passed_tests} | Failed: {failed_tests}")

        if failed_tests == 0:
            logger.info("\n🎉 ALL TESTS PASSED! Memory system is ready for production!")
        else:
            logger.info(f"\n⚠️  {failed_tests} test(s) failed. Please review the errors above.")

        return failed_tests == 0


async def main():
    """Main test runner"""
    tester = MemorySystemTester()
    success = await tester.run_all_tests()

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    # Run tests
    asyncio.run(main())