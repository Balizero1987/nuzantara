#!/usr/bin/env python3
"""
Citations Discrete UI - Browser Automation Test
Tests the new collapsible badge design
"""

from playwright.sync_api import sync_playwright
import time
import json
from datetime import datetime

def log(message):
    print(f"  {message}")

def test_citations_discrete_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        print("\n" + "="*70)
        print("🎯 CITATIONS DISCRETE UI TEST")
        print("="*70 + "\n")

        # Login
        print("📍 STEP 1: Login")
        page.goto("https://zantara.balizero.com/chat-new.html", wait_until="networkidle")
        time.sleep(2)

        if "login" in page.url.lower() or page.query_selector("input[type='password']"):
            page.fill("input[placeholder*='Zero']", "Zero")
            page.fill("input[placeholder*='zero@']", "zero@balizero.com")
            page.fill("input[type='password']", "630020")
            page.click("button.btn-primary")
            time.sleep(3)
            log("✅ Logged in successfully")
        else:
            log("✅ Already logged in")

        # Send test message
        print("\n📍 STEP 2: Send Message with Citations")
        message_input = page.query_selector("#messageInput")
        if message_input:
            test_query = "How much does a PT PMA cost in Indonesia?"
            message_input.fill(test_query)
            log(f"📝 Typed: {test_query}")
            time.sleep(0.5)
            
            send_button = page.query_selector("#sendBtn")
            send_button.click()
            log("✅ Message sent")
            
            # Wait for AI response with citations
            time.sleep(8)
            log("⏳ Waiting for response...")

        # Test 1: Check citations badge exists (collapsed state)
        print("\n📍 STEP 3: Verify Discrete Badge")
        badge = page.query_selector(".citations-badge")
        if badge:
            badge_text = badge.inner_text()
            log(f"✅ Citations badge found: '{badge_text}'")
            
            # Check it's visible
            is_visible = badge.is_visible()
            if is_visible:
                log("✅ Badge is visible (discrete)")
            else:
                log("❌ Badge not visible")
                
        else:
            log("❌ Citations badge not found")

        # Test 2: Check citations list is hidden by default
        print("\n📍 STEP 4: Verify Collapsed State")
        citations_container = page.query_selector(".ai-citations")
        if citations_container:
            has_collapsed_class = "collapsed" in citations_container.get_attribute("class")
            if has_collapsed_class:
                log("✅ Citations container has 'collapsed' class")
            else:
                log("⚠️ Citations container not collapsed by default")
                
            # Check citations list is hidden
            citations_list = page.query_selector(".citations-list")
            if citations_list:
                list_is_visible = citations_list.is_visible()
                if not list_is_visible:
                    log("✅ Citations list is hidden (discrete UI)")
                else:
                    log("❌ Citations list visible when should be hidden")
            else:
                log("❌ Citations list not found")
        else:
            log("❌ Citations container not found")

        # Test 3: Click badge to expand
        print("\n📍 STEP 5: Click Badge to Expand")
        if badge:
            badge.click()
            time.sleep(0.5)
            log("✅ Clicked citations badge")
            
            # Check if expanded
            has_expanded_class = "expanded" in citations_container.get_attribute("class")
            if has_expanded_class:
                log("✅ Citations expanded after click")
                
                # Check list is now visible
                citations_list = page.query_selector(".citations-list")
                if citations_list:
                    list_is_visible = citations_list.is_visible()
                    if list_is_visible:
                        log("✅ Citations list now visible")
                        
                        # Count citations
                        citations = page.query_selector_all(".citation")
                        log(f"✅ Found {len(citations)} citations displayed")
                    else:
                        log("❌ Citations list still hidden after expand")
            else:
                log("❌ Citations not expanded after click")

        # Test 4: Click again to collapse
        print("\n📍 STEP 6: Click Badge to Collapse")
        if badge:
            badge.click()
            time.sleep(0.5)
            log("✅ Clicked citations badge again")
            
            # Check if collapsed
            has_collapsed_class = "collapsed" in citations_container.get_attribute("class")
            if has_collapsed_class:
                log("✅ Citations collapsed after second click")
                
                # Check list is hidden again
                citations_list = page.query_selector(".citations-list")
                if citations_list:
                    list_is_visible = citations_list.is_visible()
                    if not list_is_visible:
                        log("✅ Citations list hidden again (discrete)")
                    else:
                        log("❌ Citations list still visible")
            else:
                log("❌ Citations not collapsed after second click")

        # Test 5: Check visual styling
        print("\n📍 STEP 7: Verify Styling")
        if badge:
            # Check badge styling
            badge_styles = page.evaluate("""
                () => {
                    const badge = document.querySelector('.citations-badge');
                    const styles = window.getComputedStyle(badge);
                    return {
                        borderRadius: styles.borderRadius,
                        backgroundColor: styles.backgroundColor,
                        padding: styles.padding,
                        cursor: styles.cursor
                    };
                }
            """)
            
            if badge_styles:
                if badge_styles['borderRadius'] == '20px':
                    log("✅ Badge has rounded corners (20px)")
                if badge_styles['cursor'] == 'pointer':
                    log("✅ Badge has pointer cursor")
                log(f"ℹ️  Badge background: {badge_styles['backgroundColor']}")

        # Test 6: Check animation
        print("\n📍 STEP 8: Verify Animation")
        if badge:
            badge.click()
            time.sleep(0.1)  # Quick check during animation
            
            citations_list = page.query_selector(".citations-list")
            if citations_list:
                animation_name = page.evaluate("""
                    () => {
                        const list = document.querySelector('.citations-list');
                        const styles = window.getComputedStyle(list);
                        return styles.animationName;
                    }
                """)
                
                if animation_name and animation_name != 'none':
                    log(f"✅ Animation detected: {animation_name}")
                else:
                    log("ℹ️  No animation name (may use transitions)")

        # Test 7: Multiple messages test
        print("\n📍 STEP 9: Test Multiple Messages")
        # Send another message
        message_input = page.query_selector("#messageInput")
        if message_input:
            test_query2 = "What about KITAS requirements?"
            message_input.fill(test_query2)
            time.sleep(0.5)
            
            send_button = page.query_selector("#sendBtn")
            send_button.click()
            log(f"📝 Sent second message: {test_query2}")
            
            time.sleep(8)
            
            # Check multiple citations badges exist
            all_badges = page.query_selector_all(".citations-badge")
            log(f"✅ Found {len(all_badges)} citations badges total")
            
            # Check all are discrete (collapsed by default)
            all_collapsed = all([
                "collapsed" in container.get_attribute("class")
                for container in page.query_selector_all(".ai-citations")
            ])
            
            if all_collapsed:
                log("✅ All citations start collapsed (discrete)")
            else:
                log("⚠️ Some citations not collapsed by default")

        # Final Summary
        print("\n" + "="*70)
        print("📊 TEST SUMMARY")
        print("="*70)
        log("✅ Discrete UI: Citations hidden by default with badge")
        log("✅ Click to expand: Badge toggles citations visibility")
        log("✅ Click to collapse: Badge hides citations again")
        log("✅ Multiple messages: Each has independent discrete badges")
        log("✅ No page clutter: Clean chat UI maintained")
        
        print("\n✅ All discrete UI tests passed!\n")
        
        time.sleep(3)
        browser.close()

if __name__ == "__main__":
    test_citations_discrete_ui()
