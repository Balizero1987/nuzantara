"""
ChatGPT Browser Agent - Uses Playwright to interact with ChatGPT
Leverages user's ChatGPT Plus subscription via browser automation
"""

from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
import os
import asyncio
from typing import Dict, Any, Optional
import json
from datetime import datetime

class ChatGPTBrowserAgent:
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.is_logged_in = False

    async def initialize(self):
        """Initialize browser and login to ChatGPT"""
        if self.browser:
            return

        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)
        self.page = await self.browser.new_page()

        # Navigate to ChatGPT
        await self.page.goto("https://chat.openai.com")

        # Check if session exists or needs login
        # Note: In production, you'd use saved cookies/session
        self.is_logged_in = True

    async def execute(self, action: str, params: Dict[str, Any]) -> Any:
        """Execute action using ChatGPT via browser"""

        await self.initialize()

        if action == "research_topic":
            return await self._research(params)
        elif action == "explain_concept":
            return await self._explain(params)
        elif action == "test_webapp":
            return await self._test_webapp(params)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _research(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Research topic using ChatGPT"""

        query = params.get("query", "")
        prompt = f"Research and summarize: {query}"

        # Send prompt to ChatGPT via browser
        # Simplified - real implementation would interact with UI

        return {
            "status": "success",
            "message": "Research queued",
            "action": "research_topic"
        }

    async def _explain(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Explain concept using ChatGPT"""

        return {
            "status": "success",
            "message": "Explanation queued",
            "action": "explain_concept"
        }

    async def _test_webapp(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Test the Zantara webapp for quality and functionality"""

        test_browser = None
        test_page = None

        try:
            # Create a new browser instance for testing
            playwright = await async_playwright().start()
            test_browser = await playwright.chromium.launch(
                headless=True,
                args=['--disable-blink-features=AutomationControlled']
            )

            # Create context with viewport
            context = await test_browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            test_page = await context.new_page()

            # Navigate to the webapp
            print("Navigating to https://zantara.balizero.com...")
            await test_page.goto("https://zantara.balizero.com", wait_until="networkidle")

            # Wait for the login form to appear
            await test_page.wait_for_selector("input[type='text'], input[type='password'], input[placeholder*='PIN' i]", timeout=10000)

            # Check if PIN field exists (it should be in the form)
            pin_field = await test_page.query_selector("input[type='password'], input[placeholder*='PIN' i], input[name*='pin' i]")

            if pin_field:
                # Enter PIN if field exists
                print("Entering PIN...")
                await pin_field.fill("123456")  # Default PIN for testing

                # Look for submit button
                submit_button = await test_page.query_selector("button[type='submit'], button:has-text('Login'), button:has-text('Enter'), button:has-text('Submit')")
                if submit_button:
                    await submit_button.click()
                    await test_page.wait_for_load_state("networkidle", timeout=5000)

            # Wait for chat interface to load
            print("Waiting for chat interface...")
            await test_page.wait_for_selector(
                "textarea, input[type='text'][placeholder*='message' i], input[type='text'][placeholder*='ask' i], input[type='text'][placeholder*='type' i]",
                timeout=15000
            )

            # Find the message input field
            input_field = await test_page.query_selector(
                "textarea, input[type='text'][placeholder*='message' i], input[type='text'][placeholder*='ask' i], input[type='text'][placeholder*='type' i]"
            )

            if not input_field:
                return {
                    "success": False,
                    "response_quality": "failed",
                    "response_preview": "",
                    "issues": ["Could not find message input field"]
                }

            # Send test question
            test_question = "quanto costa kitas e23 freelance offshore?"
            print(f"Sending test question: {test_question}")
            await input_field.fill(test_question)

            # Submit the question (press Enter or click send button)
            await input_field.press("Enter")

            # Alternative: look for send button
            send_button = await test_page.query_selector("button[type='submit'], button:has-text('Send'), button[aria-label*='send' i]")
            if send_button:
                await send_button.click()

            # Wait for response (30 seconds timeout)
            print("Waiting for response...")
            response_received = False
            response_text = ""
            start_time = asyncio.get_event_loop().time()

            while (asyncio.get_event_loop().time() - start_time) < 30:
                # Look for response elements
                response_elements = await test_page.query_selector_all(
                    ".message, .response, .chat-message, div[class*='message'], div[class*='response'], div[role='article']"
                )

                if response_elements:
                    for element in response_elements:
                        text = await element.text_content()
                        if text and len(text) > 50:  # Assume a proper response has at least 50 chars
                            # Check if this is likely a bot response (not the user's question)
                            if test_question not in text:
                                response_text = text
                                response_received = True
                                break

                if response_received:
                    break

                await asyncio.sleep(1)

            # Evaluate response quality
            quality = "poor"
            issues = []

            if not response_received:
                issues.append("No response received within 30 seconds")
            else:
                # Check for specific cost information
                cost_keywords = ["$", "USD", "dollari", "euro", "€", "cost", "price", "prezzo", "tariffa"]
                has_cost_info = any(keyword.lower() in response_text.lower() for keyword in cost_keywords)

                # Check for KITAS E23 specific information
                has_kitas_info = "kitas" in response_text.lower() or "e23" in response_text.lower()

                # Check for freelance/offshore context
                has_context = "freelance" in response_text.lower() or "offshore" in response_text.lower()

                if has_cost_info and has_kitas_info:
                    quality = "excellent"
                elif has_cost_info or has_kitas_info:
                    quality = "good"
                    if not has_cost_info:
                        issues.append("Response lacks specific cost information")
                    if not has_kitas_info:
                        issues.append("Response doesn't mention KITAS E23 specifically")
                else:
                    quality = "poor"
                    issues.append("Response lacks both cost and KITAS E23 information")

                if not has_context:
                    issues.append("Response doesn't address freelance/offshore context")

            # Prepare result
            result = {
                "success": response_received,
                "response_quality": quality,
                "response_preview": response_text[:500] if response_text else "",
                "issues": issues,
                "timestamp": datetime.now().isoformat(),
                "test_question": test_question
            }

            return result

        except PlaywrightTimeout as e:
            return {
                "success": False,
                "response_quality": "failed",
                "response_preview": "",
                "issues": [f"Timeout error: {str(e)}"]
            }
        except Exception as e:
            return {
                "success": False,
                "response_quality": "failed",
                "response_preview": "",
                "issues": [f"Unexpected error: {str(e)}"]
            }
        finally:
            # Clean up test browser
            if test_page:
                await test_page.close()
            if test_browser:
                await test_browser.close()

    async def get_status(self) -> Dict[str, Any]:
        """Get agent status"""
        return {
            "initialized": self.browser is not None,
            "logged_in": self.is_logged_in,
            "available": True
        }

    async def cleanup(self):
        """Cleanup browser resources"""
        if self.browser:
            await self.browser.close()
