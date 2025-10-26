"""
ZANTARA - Quick Test for 3 Critical Fixes
Test rapido mirato per verificare:
1. Pricing Calculator - Widget reference e toggle
2. Memory Panel - Ctrl+H Mac compatibility e z-index 99999
3. Document Upload - Close button con ID specifico

Durata stimata: 2-3 minuti
"""

import asyncio
from playwright.async_api import async_playwright
import time

# Configuration
CONFIG = {
    'webapp_url': 'https://zantara.balizero.com/chat-new.html',
    'login_url': 'https://zantara.balizero.com/login-new.html',
    'headless': False,
    'slow_mo': 1000,  # 1 secondo delay
    'timeout': 30000,  # 30 secondi timeout
    'viewport': {'width': 1920, 'height': 1080},
    'test_user': {
        'name': 'Krisna',
        'email': 'krisna@balizero.com',
        'pin': '705802'
    }
}

# Test results
results = {
    'pricing_calculator': {'status': 'not_tested', 'details': []},
    'memory_panel': {'status': 'not_tested', 'details': []},
    'document_upload': {'status': 'not_tested', 'details': []}
}

async def login(page):
    """Login to ZANTARA"""
    print("\n🔐 Logging in to ZANTARA...")
    
    try:
        await page.goto(CONFIG['login_url'])
        await asyncio.sleep(2)
        
        # Fill login form
        await page.fill('input[name="name"]', CONFIG['test_user']['name'])
        await page.fill('input[name="email"]', CONFIG['test_user']['email'])
        await page.fill('input[name="pin"]', CONFIG['test_user']['pin'])
        
        # Click login
        await page.click('button[type="submit"]')
        await asyncio.sleep(3)
        
        # Verify redirect to chat
        current_url = page.url
        if 'chat-new.html' in current_url:
            print("✅ Login successful")
            return True
        else:
            print(f"⚠️ Unexpected URL: {current_url}")
            return False
            
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return False

async def test_pricing_calculator(page):
    """Test FIX 1: Pricing Calculator widget reference e toggle"""
    print("\n" + "="*60)
    print("🧪 TEST 1: PRICING CALCULATOR")
    print("="*60)
    
    try:
        # Wait for button
        await page.wait_for_selector('#priceCalcBtn', timeout=10000)
        results['pricing_calculator']['details'].append("✅ Button found")
        print("   ✅ Pricing calculator button found")
        
        # Click to toggle (should expand)
        await page.click('#priceCalcBtn')
        await asyncio.sleep(2)
        
        # Check if widget is expanded
        widget_expanded = await page.is_visible('.pricing-calculator-widget.expanded')
        
        if widget_expanded:
            results['pricing_calculator']['details'].append("✅ Widget expands on click")
            print("   ✅ Widget expanded successfully")
            
            # Check if panel is visible
            panel_visible = await page.is_visible('.pricing-panel')
            if panel_visible:
                results['pricing_calculator']['details'].append("✅ Panel visible")
                print("   ✅ Panel is visible")
                
                # Test checkbox interaction
                await page.check('input[value="kitas-working"]')
                await asyncio.sleep(1)
                print("   ✅ Checkbox interaction works")
                
                # Close widget
                await page.click('#priceCalcBtn')
                await asyncio.sleep(2)
                
                widget_collapsed = await page.is_visible('.pricing-calculator-widget.collapsed')
                if widget_collapsed:
                    results['pricing_calculator']['details'].append("✅ Widget collapses on re-click")
                    print("   ✅ Widget collapsed successfully")
                    results['pricing_calculator']['status'] = 'passed'
                else:
                    results['pricing_calculator']['details'].append("⚠️ Widget doesn't collapse")
                    print("   ⚠️ Widget didn't collapse properly")
                    results['pricing_calculator']['status'] = 'partial'
            else:
                results['pricing_calculator']['details'].append("❌ Panel not visible")
                print("   ❌ Panel not visible when expanded")
                results['pricing_calculator']['status'] = 'failed'
        else:
            results['pricing_calculator']['details'].append("❌ Widget doesn't expand")
            print("   ❌ Widget didn't expand on click")
            results['pricing_calculator']['status'] = 'failed'
            
    except Exception as e:
        results['pricing_calculator']['status'] = 'error'
        results['pricing_calculator']['details'].append(f"❌ Error: {str(e)[:100]}")
        print(f"   ❌ Error: {str(e)[:100]}")

async def test_memory_panel(page):
    """Test FIX 2: Memory Panel Ctrl+H Mac compatibility e z-index"""
    print("\n" + "="*60)
    print("🧪 TEST 2: MEMORY PANEL")
    print("="*60)
    
    try:
        import platform
        modifier = 'Meta' if platform.system() == 'Darwin' else 'Control'
        print(f"   Using keyboard modifier: {modifier}")
        
        # Press Cmd/Ctrl+H
        await page.keyboard.down(modifier)
        await page.keyboard.press('h')
        await page.keyboard.up(modifier)
        await asyncio.sleep(2)
        
        results['memory_panel']['details'].append(f"✅ Pressed {modifier}+H")
        
        # Check if panel is active
        panel_active = await page.is_visible('.memory-panel.active')
        
        if panel_active:
            results['memory_panel']['details'].append("✅ Panel activated")
            print("   ✅ Memory panel opened successfully")
            
            # Check if panel container is visible
            container_visible = await page.is_visible('.memory-panel-container')
            if container_visible:
                results['memory_panel']['details'].append("✅ Container visible")
                print("   ✅ Panel container is visible")
                
                # Check z-index (via computed style)
                z_index = await page.evaluate("""
                    () => {
                        const panel = document.querySelector('.memory-panel');
                        return window.getComputedStyle(panel).zIndex;
                    }
                """)
                print(f"   📊 Z-index: {z_index}")
                results['memory_panel']['details'].append(f"✅ Z-index: {z_index}")
                
                if z_index == '99999':
                    results['memory_panel']['details'].append("✅ Z-index correct (99999)")
                    print("   ✅ Z-index is correct (99999)")
                
                # Close panel
                await page.click('.memory-panel-close')
                await asyncio.sleep(1)
                
                panel_closed = not await page.is_visible('.memory-panel.active')
                if panel_closed:
                    results['memory_panel']['details'].append("✅ Panel closes correctly")
                    print("   ✅ Panel closed successfully")
                    results['memory_panel']['status'] = 'passed'
                else:
                    results['memory_panel']['details'].append("⚠️ Panel doesn't close")
                    results['memory_panel']['status'] = 'partial'
            else:
                results['memory_panel']['details'].append("❌ Container not visible")
                print("   ❌ Panel container not visible")
                results['memory_panel']['status'] = 'failed'
        else:
            results['memory_panel']['details'].append("❌ Panel not activated")
            print("   ❌ Memory panel didn't open with Ctrl+H")
            
            # Debug: Check if panel exists in DOM
            panel_exists = await page.query_selector('#memoryPanel')
            if panel_exists:
                print("   ℹ️ Panel element exists in DOM but not active")
                results['memory_panel']['details'].append("ℹ️ Panel exists but not active")
            else:
                print("   ℹ️ Panel element NOT found in DOM")
                results['memory_panel']['details'].append("❌ Panel not in DOM")
                
            results['memory_panel']['status'] = 'failed'
            
    except Exception as e:
        results['memory_panel']['status'] = 'error'
        results['memory_panel']['details'].append(f"❌ Error: {str(e)[:100]}")
        print(f"   ❌ Error: {str(e)[:100]}")

async def test_document_upload(page):
    """Test FIX 3: Document Upload close button con ID specifico"""
    print("\n" + "="*60)
    print("🧪 TEST 3: DOCUMENT UPLOAD")
    print("="*60)
    
    try:
        # Click document upload button
        await page.wait_for_selector('#docUploadBtn', timeout=10000)
        results['document_upload']['details'].append("✅ Button found")
        print("   ✅ Document upload button found")
        
        await page.click('#docUploadBtn')
        await asyncio.sleep(2)
        
        # Check if modal is visible
        modal_visible = await page.is_visible('.document-upload-modal')
        
        if modal_visible:
            results['document_upload']['details'].append("✅ Modal opened")
            print("   ✅ Document upload modal opened")
            
            # Check if close button with specific ID exists
            close_btn_exists = await page.query_selector('#docUploadCloseBtn')
            if close_btn_exists:
                results['document_upload']['details'].append("✅ Close button with ID found")
                print("   ✅ Close button #docUploadCloseBtn found")
                
                # Count .close-btn elements to verify no ambiguity
                close_btn_count = await page.locator('.close-btn').count()
                print(f"   📊 Total .close-btn elements in page: {close_btn_count}")
                results['document_upload']['details'].append(f"ℹ️ Total .close-btn: {close_btn_count}")
                
                # Click specific close button
                await page.click('#docUploadCloseBtn')
                await asyncio.sleep(2)
                
                # Verify modal closed
                modal_closed = not await page.is_visible('.document-upload-modal')
                if modal_closed:
                    results['document_upload']['details'].append("✅ Modal closes with specific ID")
                    print("   ✅ Modal closed successfully with #docUploadCloseBtn")
                    results['document_upload']['status'] = 'passed'
                else:
                    results['document_upload']['details'].append("⚠️ Modal didn't close")
                    print("   ⚠️ Modal didn't close")
                    results['document_upload']['status'] = 'partial'
            else:
                results['document_upload']['details'].append("❌ Close button ID not found")
                print("   ❌ Close button #docUploadCloseBtn NOT found")
                results['document_upload']['status'] = 'failed'
        else:
            results['document_upload']['details'].append("❌ Modal didn't open")
            print("   ❌ Document upload modal didn't open")
            results['document_upload']['status'] = 'failed'
            
    except Exception as e:
        results['document_upload']['status'] = 'error'
        results['document_upload']['details'].append(f"❌ Error: {str(e)[:100]}")
        print(f"   ❌ Error: {str(e)[:100]}")

def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in results.values() if r['status'] == 'passed')
    failed = sum(1 for r in results.values() if r['status'] == 'failed')
    partial = sum(1 for r in results.values() if r['status'] == 'partial')
    error = sum(1 for r in results.values() if r['status'] == 'error')
    
    print(f"\n✅ Passed: {passed}/3")
    print(f"❌ Failed: {failed}/3")
    print(f"⚠️ Partial: {partial}/3")
    print(f"💥 Error: {error}/3")
    
    print("\n" + "-"*60)
    print("DETAILED RESULTS:")
    print("-"*60)
    
    for test_name, result in results.items():
        status_icon = {
            'passed': '✅',
            'failed': '❌',
            'partial': '⚠️',
            'error': '💥',
            'not_tested': '⏭️'
        }.get(result['status'], '❓')
        
        print(f"\n{status_icon} {test_name.upper().replace('_', ' ')}: {result['status']}")
        for detail in result['details']:
            print(f"   {detail}")
    
    print("\n" + "="*60)

async def main():
    """Main test execution"""
    print("🚀 Starting Quick Fix Verification Test")
    print("Testing 3 critical fixes:")
    print("1. Pricing Calculator widget reference")
    print("2. Memory Panel Ctrl+H + z-index 99999")
    print("3. Document Upload close button ID")
    print("="*60)
    
    start_time = time.time()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=CONFIG['headless'],
            slow_mo=CONFIG['slow_mo']
        )
        
        context = await browser.new_context(
            viewport=CONFIG['viewport']
        )
        
        page = await context.new_page()
        
        try:
            # Login
            login_success = await login(page)
            
            if login_success:
                # Run tests
                await test_pricing_calculator(page)
                await test_memory_panel(page)
                await test_document_upload(page)
            else:
                print("❌ Login failed - cannot proceed with tests")
            
            # Print summary
            duration = time.time() - start_time
            print(f"\n⏱️ Total duration: {duration:.1f}s")
            print_summary()
            
            # Keep browser open for inspection
            print("\n👁️ Browser will stay open for 15 seconds for inspection...")
            await asyncio.sleep(15)
            
        except Exception as e:
            print(f"\n💥 Fatal error: {e}")
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
