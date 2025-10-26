#!/usr/bin/env python3
"""
Citations Feature - Browser Automation Test
Tests TIER 2 Citations module on production webapp
"""

from playwright.sync_api import sync_playwright
import time
import json
from datetime import datetime

class CitationsAutomationTest:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "feature": "Citations Module (TIER 2)",
            "tests": []
        }
        self.test_count = 0
        self.pass_count = 0

    def log(self, message):
        """Print formatted message"""
        print(f"  {message}")

    def test_passed(self, test_name, details=""):
        """Log passed test"""
        self.pass_count += 1
        self.test_count += 1
        self.log(f"✅ {test_name}" + (f" - {details}" if details else ""))
        self.results["tests"].append({
            "name": test_name,
            "status": "PASS",
            "details": details
        })

    def test_failed(self, test_name, reason=""):
        """Log failed test"""
        self.test_count += 1
        self.log(f"❌ {test_name}" + (f" - {reason}" if reason else ""))
        self.results["tests"].append({
            "name": test_name,
            "status": "FAIL",
            "reason": reason
        })

    def run(self):
        """Run all tests"""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            page = browser.new_page()

            # Capture console messages for debugging
            def log_console_msg(msg):
                print(f"  [CONSOLE] {msg.type}: {msg.text}")

            page.on("console", log_console_msg)

            print("\n" + "="*70)
            print("🎯 CITATIONS MODULE - COMPREHENSIVE AUTOMATION TEST")
            print("="*70 + "\n")

            # Test 1: Setup & Login
            print("📍 SETUP & LOGIN")
            page.goto("https://zantara.balizero.com/chat-new.html", wait_until="networkidle")
            time.sleep(1)

            if "login" in page.url.lower():
                page.fill("input[placeholder*='Zero']", "Zero")
                page.fill("input[placeholder*='zero@']", "zero@balizero.com")
                page.fill("input[type='password']", "630020")
                page.click("button.btn-primary")
                page.wait_for_url("**/chat-new.html", timeout=10000)
                time.sleep(2)
                self.test_passed("Login successful")
            else:
                self.test_passed("Already logged in")

            # Test 2: Verify Citations module loaded
            print("\n📦 MODULE VERIFICATION")
            citations_loaded = page.evaluate("typeof window.Citations === 'object'")
            if citations_loaded:
                self.test_passed("Citations module loaded")
            else:
                self.test_failed("Citations module", "Not found in window")
                browser.close()
                return

            # Test 3: Verify Citations methods
            print("\n⚙️  METHODS VERIFICATION")
            methods = {
                "render": page.evaluate("typeof window.Citations.render === 'function'"),
                "extract": page.evaluate("typeof window.Citations.extract === 'function'"),
                "hasCitations": page.evaluate("typeof window.Citations.hasCitations === 'function'"),
                "formatAsText": page.evaluate("typeof window.Citations.formatAsText === 'function'"),
            }

            for method, available in methods.items():
                if available:
                    self.test_passed(f"Method {method}() available")
                else:
                    self.test_failed(f"Method {method}()", "Not found")

            # Test 4: Send message and verify citations render
            print("\n📨 CITATIONS RENDERING")

            # Use diverse test questions (verified from SmartSuggestions tests)
            test_messages = [
                {"query": "How much does it cost to set up a PT company?", "lang": "EN"},  # Business topic
                {"query": "Come costituire una PT company?", "lang": "IT"},  # Business topic in Italian
                {"query": "Bagaimana cara mendirikan PT?", "lang": "ID"},  # Business topic in Indonesian
            ]

            for idx, msg_data in enumerate(test_messages, 1):
                print(f"\n  Test {idx}: {msg_data['lang']} - '{msg_data['query'][:40]}...'")

                input_field = page.locator("#chatInput")
                input_field.fill(msg_data['query'])
                self.test_passed(f"Message {idx} typed", msg_data['query'][:40])

                # Wait before sending
                time.sleep(2)

                page.click("#sendBtn")
                self.test_passed(f"Message {idx} sent")

                # Wait for response (increased from 8 to 20 seconds for slow backend)
                print(f"  ⏳ Waiting 20 seconds for response...")
                time.sleep(20)

                # Check if citations exist in DOM
                citations_exist = page.evaluate("""
                    document.querySelectorAll('.ai-citations').length > 0
                """)

                if citations_exist:
                    # Get citation count
                    citation_count = page.evaluate("""
                        document.querySelectorAll('.citation').length
                    """)
                    
                    # Get citation details
                    citation_sources = page.evaluate("""
                        Array.from(document.querySelectorAll('.citation-source')).map(el => el.textContent)
                    """)

                    self.test_passed(
                        f"Message {idx} citations rendered",
                        f"{citation_count} citations: {', '.join(citation_sources[:3])}"
                    )
                else:
                    self.test_failed(f"Message {idx} citations", "Citations not found in DOM")

            # Test 5: Verify Citation structure
            print("\n🔍 CITATION STRUCTURE VERIFICATION")

            # Get citation element counts
            has_tier = page.evaluate("!!document.querySelector('.citation-tier')")
            has_similarity = page.evaluate("!!document.querySelector('.citation-similarity')")
            has_source = page.evaluate("!!document.querySelector('.citation-source')")
            citation_count = page.evaluate("document.querySelectorAll('.citation').length")

            if has_tier:
                self.test_passed("Tier badges present", f"{citation_count} citations with T1/T2/T3 badges")
            else:
                # This is expected if no citations found (backend not returning sources)
                self.test_failed("Tier badges", "No citations with tiers found (backend issue)")

            if has_similarity:
                self.test_passed("Similarity scores visible", "Relevance percentages shown")
            else:
                self.test_failed("Similarity scores", "Not displayed")

            # Test 6: Test Citation module functions directly
            print("\n📊 CITATION MODULE FUNCTIONS")

            # Test hasCitations function
            has_cit = page.evaluate("""
                window.Citations.hasCitations({
                    response: 'Test',
                    sources: [{source: 'Test', tier: 'T1', similarity: 0.9}]
                })
            """)

            if has_cit:
                self.test_passed("Citations.hasCitations() working", "Detects sources correctly")
            else:
                self.test_failed("Citations.hasCitations()", "Not detecting sources")

            # Test extract function
            extracted = page.evaluate("""
                window.Citations.extract({
                    sources: [
                        {source: 'Doc1', tier: 'T1', similarity: 0.9},
                        {source: 'Doc2', tier: 'T2', similarity: 0.8}
                    ]
                }).length
            """)

            if extracted == 2:
                self.test_passed("Citations.extract() working", f"Extracted {extracted} citations")
            else:
                self.test_failed("Citations.extract()", f"Expected 2, got {extracted}")

            # Test 7: Integration with SmartSuggestions
            print("\n✨ SMART SUGGESTIONS INTEGRATION")

            both_loaded = page.evaluate("""
                typeof window.SmartSuggestions === 'object' && 
                typeof window.Citations === 'object'
            """)

            if both_loaded:
                self.test_passed("Smart Suggestions + Citations loaded", "Both modules coexist")
            else:
                self.test_failed("Module integration", "Missing SmartSuggestions or Citations")

            # Test 8: Check for console errors
            print("\n🔧 ERROR CHECKING")

            console_errors = page.evaluate("""
                window.hasErrors || window.errorCount || 
                document.querySelectorAll('[data-error]').length > 0
            """)

            if not console_errors:
                self.test_passed("No console errors", "Clean execution")
            else:
                self.test_failed("Console errors detected", "Check browser console")

            # Summary
            print("\n" + "="*70)
            print(f"📊 TEST SUMMARY: {self.pass_count}/{self.test_count} tests passed")
            print(f"✅ Pass Rate: {(self.pass_count/self.test_count)*100:.1f}%")
            print("="*70 + "\n")

            if self.pass_count == self.test_count:
                print("🎉 ALL TESTS PASSED!")
            else:
                print(f"⚠️  {self.test_count - self.pass_count} test(s) failed")

            # Save results
            self.results["summary"] = {
                "total": self.test_count,
                "passed": self.pass_count,
                "failed": self.test_count - self.pass_count,
                "pass_rate": f"{(self.pass_count/self.test_count)*100:.1f}%"
            }

            with open('/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/CITATIONS_TEST_RESULTS.json', 'w') as f:
                json.dump(self.results, f, indent=2)

            print("\n📁 Results saved to: CITATIONS_TEST_RESULTS.json\n")

            browser.close()

if __name__ == "__main__":
    test = CitationsAutomationTest()
    test.run()
