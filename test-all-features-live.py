"""
ZANTARA - Complete Features Live Testing
Browser automation con 50 domande per testare tutte le 9 features TIER 1

Features testate:
1. Citations UI (discrete badge)
2. Pricing Calculator Widget
3. Team Roster Page
4. Clarification Prompts UI
5. Memory/History Panel
6. AI Image Creator (FREE models)
7. Document Upload
8. Multi-language Support
9. Conversation History UI

Configurazione:
- Timeout alto (120s per risposta)
- Velocità rallentata (delays tra azioni)
- Live viewing (visibile in real-time)
- 50 domande comprehensive
"""

import asyncio
import time
from playwright.async_api import async_playwright
import json
from datetime import datetime

# Configuration
CONFIG = {
    'webapp_url': 'https://zantara.balizero.com/chat-new.html',
    'login_url': 'https://zantara.balizero.com/login-new.html',
    'team_url': 'https://zantara.balizero.com/team.html',
    'headless': False,  # NON headless per vedere live
    'slow_mo': 2000,    # 2 secondi delay tra azioni (rallentato)
    'timeout': 120000,  # 120 secondi timeout
    'viewport': {'width': 1920, 'height': 1080},
    'test_user': {
        'name': 'zero',
        'email': 'zero@balizero.com',
        'pin': '010719'
    }
}

# 50 Test Questions - Comprehensive coverage
TEST_QUESTIONS = [
    # Basic Questions (10)
    "How can I get an E23 Freelance KITAS?",
    "What is the cost of opening a PT company in Indonesia?",
    "What are the visa options for investors?",
    "How long does it take to process a KITAS?",
    "What documents do I need for company registration?",
    "Can I work remotely with an E23 visa?",
    "What is the difference between PT and CV?",
    "How much is the minimum capital for a PT?",
    "What are the tax rates for foreign investors?",
    "Can I hire Indonesian employees as a foreigner?",
    
    # Citations Testing (5)
    "Tell me about E28A investor visa requirements",
    "What is the process for getting a work permit?",
    "Explain the KITAS renewal process",
    "What are the benefits of E33A visa?",
    "How to transfer KITAS to another company?",
    
    # Clarification Prompts Testing (5) - Vague questions
    "visa",
    "cost",
    "how long",
    "requirements",
    "best option",
    
    # Pricing Calculator Testing (5)
    "How much does a KITAS cost?",
    "What is the price for company registration?",
    "Cost of accounting services?",
    "Price for residence permit?",
    "How much for tax consultation?",
    
    # Multi-topic Questions (10)
    "I want to start a business in Bali, what do I need?",
    "Can you compare E23 vs E28A visa?",
    "What's the full process from visa to company setup?",
    "I'm a digital nomad, which visa is best for me?",
    "How to hire staff and manage payroll in Indonesia?",
    "What are all the costs involved in relocating to Bali?",
    "Explain the difference between tourist visa and business visa",
    "Can I buy property in Indonesia as a foreigner?",
    "What is the timeline for complete company setup?",
    "How to extend my stay in Bali legally?",
    
    # Team & Services Questions (5)
    "Who can help me with visa applications?",
    "Which team member handles company registration?",
    "What services does Bali Zero offer?",
    "How can I contact the legal team?",
    "Who is the CEO of Bali Zero?",
    
    # Language Testing (3)
    "Berapa biaya KITAS?",  # Indonesian
    "Quanto costa aprire una società?",  # Italian
    "What is the processing time?",  # English
    
    # Complex/Long Questions (7)
    "I am a freelance software developer from Europe and I want to move to Bali to work remotely for my European clients while also potentially starting a small consulting business in Indonesia. What type of visa would be most suitable for my situation, what are the requirements, costs, and timeline for obtaining it, and can I legally work for both foreign and Indonesian clients with this visa?",
    "Can you provide a detailed breakdown of all the expenses I should expect when setting up a PT company in Indonesia, including initial registration costs, annual fees, mandatory insurances, office requirements, minimum capital requirements, notary fees, legal fees, and any other hidden costs I should be aware of?",
    "What is the complete step-by-step process for a foreigner to legally hire Indonesian employees, including work permit requirements, social security obligations, tax withholding procedures, employment contract requirements, and labor law compliance?",
    "I have a KITAS that is about to expire in 2 months. What is the exact process for renewal, how long does it take, what documents do I need to prepare, can I stay in Indonesia while it's being processed, and what happens if my current KITAS expires before the renewal is completed?",
    "Compare all available visa options for foreigners wanting to live in Bali long-term, including retirement visa, investor visa, work visa, social cultural visa, and any other options, with pros, cons, costs, requirements, and renewal processes for each",
    "I want to understand the complete tax structure in Indonesia for foreign business owners, including corporate tax rates, personal income tax, VAT, withholding taxes, tax incentives for foreign investment, double taxation treaties, and how to optimize tax efficiency legally",
    "What are all the different types of business entities I can establish in Indonesia as a foreigner, their differences, capital requirements, ownership structures, liability protections, and which one would be most suitable for a small digital marketing agency?",
]

# Results tracking
test_results = {
    'total_questions': len(TEST_QUESTIONS),
    'successful': 0,
    'failed': 0,
    'errors': [],
    'response_times': [],
    'features_tested': {
        'citations': False,
        'pricing_calculator': False,
        'team_roster': False,
        'clarification_prompts': False,
        'memory_panel': False,
        'image_creator': False,
        'document_upload': False,
        'language_selector': False,
        'conversation_history': False
    },
    'start_time': None,
    'end_time': None
}

async def login(page):
    """Login to ZANTARA"""
    print("\n🔐 Logging in...")
    
    await page.goto(CONFIG['login_url'])
    await asyncio.sleep(3)  # Rallentato per vedere la pagina
    
    # Wait for form to be visible
    await page.wait_for_selector('#loginForm', timeout=10000)
    print("📝 Login form loaded")
    
    # Fill login form (usando ID, non name)
    print(f"   Name: {CONFIG['test_user']['name']}")
    await page.fill('#name', CONFIG['test_user']['name'])
    await asyncio.sleep(1)
    
    print(f"   Email: {CONFIG['test_user']['email']}")
    await page.fill('#email', CONFIG['test_user']['email'])
    await asyncio.sleep(1)
    
    print(f"   PIN: {CONFIG['test_user']['pin']}")
    await page.fill('#pin', CONFIG['test_user']['pin'])
    await asyncio.sleep(2)
    
    # Click login button (testo corretto: "Join Team")
    print("🔘 Clicking login button...")
    await page.click('#loginBtn')
    await asyncio.sleep(5)
    
    # Wait for redirect to chat
    print("⏳ Waiting for redirect to chat...")
    try:
        await page.wait_for_url(CONFIG['webapp_url'], timeout=CONFIG['timeout'])
        print("✅ Login successful - redirected to chat")
    except Exception as e:
        print(f"⚠️ Redirect timeout or error: {e}")
        # Check if we're already on chat page
        current_url = page.url
        print(f"   Current URL: {current_url}")
        if 'chat' in current_url:
            print("✅ Already on chat page, continuing...")
        else:
            raise

async def test_language_selector(page):
    """Test Feature 11: Language Selector"""
    print("\n🌍 Testing Language Selector...")
    
    try:
        # Wait for language selector button
        await page.wait_for_selector('.language-selector-btn', timeout=10000)
        await asyncio.sleep(2)
        
        # Click to open dropdown
        await page.click('.language-selector-btn')
        await asyncio.sleep(2)
        
        # Check if dropdown is visible
        dropdown = await page.is_visible('.language-dropdown.open')
        if dropdown:
            print("✅ Language dropdown opened")
            
            # Test switching to Italian
            await page.click('button[data-lang="it"]')
            await asyncio.sleep(3)
            print("✅ Switched to Italian")
            
            # Reopen dropdown for switching back
            await page.click('.language-selector-btn')
            await asyncio.sleep(2)
            
            # Switch back to English
            await page.click('button[data-lang="en"]')
            await asyncio.sleep(3)
            print("✅ Switched back to English")
            
            test_results['features_tested']['language_selector'] = True
        else:
            print("⚠️ Language dropdown not visible")
    except Exception as e:
        print(f"❌ Language selector test failed: {str(e)[:100]}")

async def test_pricing_calculator(page):
    """Test Feature 5: Pricing Calculator"""
    print("\n💰 Testing Pricing Calculator...")
    
    try:
        # Wait for button to be visible
        await page.wait_for_selector('#priceCalcBtn', timeout=10000)
        print("   Found pricing calculator button")
        
        # Click pricing calculator button
        await page.click('#priceCalcBtn')
        await asyncio.sleep(3)
        
        # Check if widget is expanded
        widget_visible = await page.is_visible('.pricing-calculator-widget.expanded')
        if widget_visible:
            print("✅ Pricing calculator opened")
            
            # Select some services
            await page.check('input[value="kitas"]')
            await asyncio.sleep(1)
            await page.check('input[value="company"]')
            await asyncio.sleep(1)
            await page.check('input[value="accounting"]')
            await asyncio.sleep(2)
            
            # Check if summary updated
            summary = await page.text_content('.pricing-summary-total')
            print(f"✅ Total calculated: {summary}")
            
            # Close widget
            await page.click('#priceCalcBtn')
            await asyncio.sleep(2)
            
            test_results['features_tested']['pricing_calculator'] = True
        else:
            print("⚠️ Pricing calculator widget not visible")
    except Exception as e:
        print(f"❌ Pricing calculator test failed: {str(e)[:100]}")

async def test_memory_panel(page):
    """Test Feature 8: Memory Panel"""
    print("\n📚 Testing Memory Panel...")
    
    try:
        # Look for memory panel button (floating button or Ctrl+H)
        # Try keyboard shortcut (lowercase 'h')
        print("   Pressing Ctrl+H...")
        await page.keyboard.down('Control')
        await page.keyboard.press('h')
        await page.keyboard.up('Control')
        await asyncio.sleep(4)
        
        # Check if panel opened (it might be #memoryPanel, not .open class)
        panel_visible = await page.is_visible('#memoryPanel')
        if panel_visible:
            print("✅ Memory panel opened")
            
            # Wait a bit to see content
            await asyncio.sleep(3)
            
            # Close panel
            await page.keyboard.press('Escape')
            await asyncio.sleep(2)
            
            test_results['features_tested']['memory_panel'] = True
        else:
            print("⚠️ Memory panel not visible")
    except Exception as e:
        print(f"❌ Memory panel test failed: {e}")

async def test_document_upload(page):
    """Test Feature 10: Document Upload Button"""
    print("\n📄 Testing Document Upload Button...")
    
    try:
        # Look for document upload button
        upload_btn = await page.is_visible('.document-upload-btn')
        if upload_btn:
            print("✅ Document upload button visible")
            
            # Click to open modal
            await page.click('.document-upload-btn')
            await asyncio.sleep(3)
            
            # Check if modal opened
            modal_visible = await page.is_visible('.document-upload-modal')
            if modal_visible:
                print("✅ Document upload modal opened")
                
                # Close modal
                await page.click('.close-btn')
                await asyncio.sleep(2)
                
                test_results['features_tested']['document_upload'] = True
            else:
                print("⚠️ Document upload modal not visible")
        else:
            print("⚠️ Document upload button not found")
    except Exception as e:
        print(f"❌ Document upload test failed: {e}")

async def test_conversation_history(page):
    """Test Feature 12: Conversation History in Sidebar"""
    print("\n💬 Testing Conversation History...")
    
    try:
        # Open sidebar
        await page.click('.sidebar-toggle')
        await asyncio.sleep(3)
        
        # Check if conversation list exists
        list_visible = await page.is_visible('#conversationList')
        if list_visible:
            print("✅ Conversation list visible in sidebar")
            
            # Wait to see conversations
            await asyncio.sleep(3)
            
            # Count conversation items
            items = await page.locator('.conversation-item').count()
            print(f"✅ Found {items} conversations in history")
            
            # Close sidebar
            await page.click('.sidebar-toggle')
            await asyncio.sleep(2)
            
            test_results['features_tested']['conversation_history'] = True
        else:
            print("⚠️ Conversation list not visible")
    except Exception as e:
        print(f"❌ Conversation history test failed: {e}")

async def send_question(page, question, question_num, total_questions):
    """Send a question and wait for response"""
    print(f"\n📤 Question {question_num}/{total_questions}: {question[:80]}...")
    start_time = time.time()
    
    try:
        # Clear input and type question
        await page.fill('#chatInput', '')
        await asyncio.sleep(1)
        await page.type('#chatInput', question, delay=50)  # Type with delay
        await asyncio.sleep(2)
        
        # Click send button
        await page.click('#sendBtn')
        await asyncio.sleep(2)
        
        # Wait for AI response to appear (look for .ai-content)
        print("⏳ Waiting for AI response...")
        await page.wait_for_selector('.ai-content', timeout=CONFIG['timeout'])
        
        # Wait a bit more for streaming to complete
        await asyncio.sleep(5)
        
        # Get response text
        response_elements = await page.locator('.ai-content').all()
        if response_elements:
            last_response = await response_elements[-1].text_content()
            response_time = time.time() - start_time
            
            print(f"✅ Response received ({response_time:.1f}s)")
            print(f"📝 Response preview: {last_response[:100]}...")
            
            test_results['successful'] += 1
            test_results['response_times'].append(response_time)
            
            # Check for citations badge
            citations_badge = await page.locator('.citations-badge').count()
            if citations_badge > 0:
                print("📚 Citations detected!")
                test_results['features_tested']['citations'] = True
            
            # Check for smart suggestions
            suggestions = await page.locator('.smart-suggestions-container').count()
            if suggestions > 0:
                print("💡 Smart suggestions detected!")
            
            # Check for clarification prompts
            clarifications = await page.locator('.clarification-prompt').count()
            if clarifications > 0:
                print("❓ Clarification prompt detected!")
                test_results['features_tested']['clarification_prompts'] = True
            
            return True
        else:
            print("⚠️ No response element found")
            test_results['failed'] += 1
            return False
            
    except Exception as e:
        response_time = time.time() - start_time
        print(f"❌ Error after {response_time:.1f}s: {str(e)[:100]}")
        test_results['failed'] += 1
        test_results['errors'].append({
            'question': question,
            'error': str(e),
            'question_num': question_num
        })
        return False

async def test_team_roster_page(page):
    """Test Feature 6: Team Roster Page"""
    print("\n👥 Testing Team Roster Page...")
    
    try:
        # Navigate to team page
        await page.goto(CONFIG['team_url'])
        await asyncio.sleep(5)
        
        # Check if team members are visible
        members = await page.locator('.team-member-card').count()
        if members > 0:
            print(f"✅ Found {members} team members")
            
            # Test search
            await page.fill('#teamSearch', 'Zero')
            await asyncio.sleep(2)
            await page.fill('#teamSearch', '')
            await asyncio.sleep(2)
            
            # Test department filter
            await page.click('.department-filter:first-child')
            await asyncio.sleep(2)
            
            test_results['features_tested']['team_roster'] = True
        else:
            print("⚠️ No team members found")
        
        # Go back to chat
        await page.goto(CONFIG['webapp_url'])
        await asyncio.sleep(3)
        
    except Exception as e:
        print(f"❌ Team roster test failed: {e}")

async def generate_test_report():
    """Generate comprehensive test report"""
    report = {
        'test_summary': {
            'total_questions': test_results['total_questions'],
            'successful': test_results['successful'],
            'failed': test_results['failed'],
            'success_rate': f"{(test_results['successful'] / test_results['total_questions'] * 100):.1f}%",
            'duration': f"{(test_results['end_time'] - test_results['start_time']) / 60:.1f} minutes"
        },
        'response_times': {
            'average': f"{sum(test_results['response_times']) / len(test_results['response_times']):.1f}s" if test_results['response_times'] else 'N/A',
            'min': f"{min(test_results['response_times']):.1f}s" if test_results['response_times'] else 'N/A',
            'max': f"{max(test_results['response_times']):.1f}s" if test_results['response_times'] else 'N/A'
        },
        'features_tested': test_results['features_tested'],
        'features_working': sum(test_results['features_tested'].values()),
        'total_features': len(test_results['features_tested']),
        'errors': test_results['errors']
    }
    
    # Save report
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'test_report_all_features_{timestamp}.json'
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n📊 Test report saved: {filename}")
    return report

async def main():
    """Main test execution"""
    print("🚀 Starting ZANTARA Complete Features Live Testing")
    print(f"📋 Testing {len(TEST_QUESTIONS)} questions")
    print(f"⏱️  Timeout: {CONFIG['timeout']/1000}s per response")
    print(f"🐌 Slow mode: {CONFIG['slow_mo']/1000}s delay between actions")
    print(f"👁️  Headless: {CONFIG['headless']} (you can watch live!)")
    print("="*80)
    
    test_results['start_time'] = time.time()
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(
            headless=CONFIG['headless'],
            slow_mo=CONFIG['slow_mo']
        )
        
        context = await browser.new_context(
            viewport=CONFIG['viewport'],
            locale='en-US'
        )
        
        page = await context.new_page()
        page.set_default_timeout(CONFIG['timeout'])
        
        try:
            # Login
            await login(page)
            await asyncio.sleep(3)
            
            # Test UI Features
            await test_language_selector(page)
            await test_pricing_calculator(page)
            await test_memory_panel(page)
            await test_document_upload(page)
            await test_team_roster_page(page)
            
            # Test all 50 questions
            print("\n" + "="*80)
            print("🤖 Starting 50 Questions Test")
            print("="*80)
            
            for i, question in enumerate(TEST_QUESTIONS, 1):
                await send_question(page, question, i, len(TEST_QUESTIONS))
                
                # Extra delay between questions to see responses
                await asyncio.sleep(3)
                
                # Test conversation history every 10 questions
                if i % 10 == 0:
                    await test_conversation_history(page)
            
            print("\n" + "="*80)
            print("✅ All questions completed!")
            print("="*80)
            
        except Exception as e:
            print(f"\n❌ Test execution error: {e}")
            test_results['errors'].append({
                'error': str(e),
                'phase': 'execution'
            })
        
        finally:
            test_results['end_time'] = time.time()
            
            # Generate report
            report = await generate_test_report()
            
            # Print summary
            print("\n" + "="*80)
            print("📊 TEST SUMMARY")
            print("="*80)
            print(f"Total Questions: {report['test_summary']['total_questions']}")
            print(f"Successful: {report['test_summary']['successful']}")
            print(f"Failed: {report['test_summary']['failed']}")
            print(f"Success Rate: {report['test_summary']['success_rate']}")
            print(f"Duration: {report['test_summary']['duration']}")
            print(f"\n⏱️  Response Times:")
            print(f"  Average: {report['response_times']['average']}")
            print(f"  Min: {report['response_times']['min']}")
            print(f"  Max: {report['response_times']['max']}")
            print(f"\n✅ Features Working: {report['features_working']}/{report['total_features']}")
            print("\nFeatures Status:")
            for feature, status in report['features_tested'].items():
                icon = "✅" if status else "❌"
                print(f"  {icon} {feature.replace('_', ' ').title()}")
            
            if report['errors']:
                print(f"\n⚠️  Errors: {len(report['errors'])}")
            
            print("="*80)
            
            # Keep browser open for manual inspection
            print("\n👁️  Browser will stay open for 30 seconds for inspection...")
            await asyncio.sleep(30)
            
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
