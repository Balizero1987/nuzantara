#!/usr/bin/env node

/**
 * ZANTARA WEBAPP BROWSER AUTOMATION v2.0
 * Enhanced with proper element selectors and interaction handling
 * Profile: Zero (zero@balizero.com, PIN: 010719)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Enhanced test questions covering all business aspects
const TEST_QUESTIONS = [
    "Qual è la strategia di business per il prossimo trimestre?",
    "Analizza i trend di mercato del settore AI in Indonesia",
    "Come possiamo ottimizzare i costi operativi?",
    "Quali sono le metriche KPI più importanti da monitorare?",
    "Proponi un piano di espansione per il mercato asiatico",
    "Qual è la roadmap tecnologica per i prossimi 6 mesi?",
    "Come possiamo migliorare la performance del sistema?",
    "Quali tecnologie dovremmo adottare per rimanere competitivi?",
    "Analizza l'architettura attuale e proponi miglioramenti",
    "Come possiamo scalare il sistema per 1M+ utenti?",
    "Qual è la strategia di marketing per il lancio di nuovi prodotti?",
    "Come possiamo migliorare il tasso di conversione?",
    "Quali canali di vendita sono più efficaci nel nostro settore?",
    "Analizza la concorrenza e proponi strategie di differenziazione",
    "Come possiamo aumentare il customer lifetime value?",
    "Quali processi operativi possiamo automatizzare?",
    "Come possiamo migliorare l'efficienza del team?",
    "Quali sono le best practice per il remote work?",
    "Analizza i flussi di lavoro e proponi ottimizzazioni",
    "Come possiamo implementare un sistema di performance management?",
    "Qual è la situazione finanziaria attuale e le proiezioni?",
    "Come possiamo ottimizzare la gestione della cassa?",
    "Quali opportunità di investimento dovremmo considerare?",
    "Analizza i margini di profitto e proponi strategie di miglioramento",
    "Come possiamo strutturare un piano di fundraising?",
    "Quali aree di innovazione dovremmo esplorare?",
    "Come possiamo implementare una cultura dell'innovazione?",
    "Quali tecnologie emergenti potrebbero impattare il nostro business?",
    "Analizza le tendenze del mercato e identifica opportunità",
    "Come possiamo proteggere la proprietà intellettuale?",
    "Come possiamo migliorare la customer journey?",
    "Quali sono i pain point principali dei nostri clienti?",
    "Come possiamo implementare un sistema di feedback efficace?",
    "Analizza i dati clienti e proponi personalizzazioni",
    "Come possiamo ridurre il churn rate?",
    "Quali sono i principali rischi aziendali e come mitigarli?",
    "Come possiamo implementare un sistema di compliance?",
    "Quali scenari di crisi dovremmo preparare?",
    "Analizza i rischi operativi e strategie di continuità",
    "Come possiamo proteggere i dati aziendali?",
    "Come vedi l'azienda tra 5 anni?",
    "Quali megatrend dovremo monitorare?",
    "Come possiamo prepararci per le future sfide del mercato?",
    "Qual è la visione a lungo termine per il business?",
    "Come possiamo bilanciare crescita e sostenibilità?",
    "Quali partnership strategiche dovremmo considerare?",
    "Come possiamo strutturare alleanze vantaggiose?",
    "Quali sono i criteri per selezionare partner ideali?",
    "Come possiamo gestire le relazioni con i partner chiave?",
    "Quali opportunità di co-creazione possiamo esplorare?",
    "Come possiamo implementare analytics avanzati per il business?",
    "Quali dashboard sono essenziali per il management?",
    "Come possiamo trasformare i dati in insight azionabili?",
    "Quali metriche predittive possiamo implementare?",
    "Come creare un sistema di business intelligence in real-time?"
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(page, selector, timeout = 10000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        console.log(`⚠️ Element not found: ${selector}`);
        return false;
    }
}

async function takeScreenshot(page, filename) {
    try {
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
        console.log(`❌ Screenshot failed: ${error.message}`);
    }
}

async function runZantaraTest() {
    console.log('🚀 ZANTARA WebApp Browser Automation v2.0 - Starting');
    console.log('👤 Profile: Zero (zero@balizero.com)');
    console.log('🔑 PIN: 010719');
    console.log('=====================================');

    let browser;
    try {
        // Launch browser with more realistic settings
        browser = await chromium.launch({
            headless: false,
            slowMo: 500,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        });

        const page = await context.newPage();

        // Navigate to ZANTARA
        console.log('📍 Navigating to ZANTARA...');
        await page.goto('https://nuzantara-core.fly.dev', { waitUntil: 'networkidle' });
        await sleep(2000);
        await takeScreenshot(page, 'zantara-v2-landing.png');

        // Look for login/signup options
        console.log('🔍 Looking for login options...');

        const loginSelectors = [
            'a[href*="login"]',
            'button:has-text("Login")',
            'button:has-text("Sign In")',
            '.login-btn',
            '#login-btn',
            'a:has-text("Accedi")',
            'button:has-text("Accedi")'
        ];

        let loginFound = false;
        for (const selector of loginSelectors) {
            if (await waitForElement(page, selector)) {
                console.log(`✅ Found login element: ${selector}`);
                await page.click(selector);
                await sleep(3000);
                await takeScreenshot(page, 'zantara-v2-login-page.png');
                loginFound = true;
                break;
            }
        }

        if (!loginFound) {
            console.log('❌ Login button not found, trying direct navigation...');
            await page.goto('https://nuzantara-core.fly.dev/login', { waitUntil: 'networkidle' });
            await sleep(2000);
            await takeScreenshot(page, 'zantara-v2-login-direct.png');
        }

        // Fill login credentials
        console.log('🔑 Filling login credentials...');

        const emailSelectors = [
            'input[type="email"]',
            'input[name="email"]',
            'input[placeholder*="email"]',
            'input[placeholder*="Email"]',
            '#email',
            '.email-input'
        ];

        const passwordSelectors = [
            'input[type="password"]',
            'input[name="password"]',
            'input[placeholder*="password"]',
            'input[placeholder*="Password"]',
            '#password',
            '.password-input'
        ];

        let emailFilled = false;
        let passwordFilled = false;

        // Fill email
        for (const selector of emailSelectors) {
            if (await waitForElement(page, selector, 5000)) {
                await page.fill(selector, 'zero@balizero.com');
                console.log('✅ Email filled');
                emailFilled = true;
                await sleep(1000);
                break;
            }
        }

        // Fill password
        for (const selector of passwordSelectors) {
            if (await waitForElement(page, selector, 5000)) {
                await page.fill(selector, '010719');
                console.log('✅ Password filled');
                passwordFilled = true;
                await sleep(1000);
                break;
            }
        }

        if (emailFilled && passwordFilled) {
            // Submit login
            const submitSelectors = [
                'button[type="submit"]',
                'button:has-text("Login")',
                'button:has-text("Sign In")',
                'button:has-text("Accedi")',
                'input[type="submit"]',
                '.login-submit'
            ];

            for (const selector of submitSelectors) {
                if (await waitForElement(page, selector, 5000)) {
                    await page.click(selector);
                    console.log('✅ Login submitted');
                    await sleep(5000);
                    await takeScreenshot(page, 'zantara-v2-after-login.png');
                    break;
                }
            }
        } else {
            console.log('❌ Could not fill login form');
        }

        // Look for chat/input interface
        console.log('🎯 Looking for chat interface...');
        await sleep(3000);
        await takeScreenshot(page, 'zantara-v2-dashboard.png');

        // Search for input areas or chat interfaces
        const inputSelectors = [
            'textarea[placeholder*="Ask"]',
            'textarea[placeholder*="Type"]',
            'textarea[placeholder*="Message"]',
            'input[placeholder*="Ask"]',
            'input[placeholder*="Type"]',
            'input[placeholder*="Message"]',
            'textarea',
            'input[type="text"]',
            '.chat-input',
            '.message-input',
            '#chat-input',
            '#message-input',
            '[contenteditable="true"]',
            '.input-field',
            '.query-input'
        ];

        let inputFound = false;
        for (const selector of inputSelectors) {
            if (await waitForElement(page, selector, 5000)) {
                console.log(`✅ Found input element: ${selector}`);
                inputFound = true;
                break;
            }
        }

        if (!inputFound) {
            console.log('❌ No input field found. Looking for interactive elements...');
            // Try to find any clickable element that might open a chat
            const clickableSelectors = [
                'button:has-text("Chat")',
                'button:has-text("Ask")',
                'button:has-text("New Chat")',
                '.chat-button',
                '.ask-button',
                '.new-chat-btn',
                '[role="button"]:has-text("Chat")'
            ];

            for (const selector of clickableSelectors) {
                if (await waitForElement(page, selector, 3000)) {
                    await page.click(selector);
                    console.log(`✅ Clicked: ${selector}`);
                    await sleep(3000);
                    await takeScreenshot(page, 'zantara-v2-chat-opened.png');
                    break;
                }
            }
        }

        // Test questions
        console.log('🎯 Starting test questions...');
        let questionsAnswered = 0;

        for (let i = 0; i < Math.min(5, TEST_QUESTIONS.length); i++) { // Test with 5 questions first
            const question = TEST_QUESTIONS[i];
            console.log(`Question ${i + 1}/${Math.min(5, TEST_QUESTIONS.length)}: ${question.substring(0, 50)}...`);

            // Try to find input field again for each question
            let currentInputFound = false;
            for (const selector of inputSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        await page.fill(selector, question);
                        console.log('   ✅ Question typed');
                        currentInputFound = true;

                        // Look for send button
                        const sendSelectors = [
                            'button:has-text("Send")',
                            'button:has-text("Submit")',
                            'button[type="submit"]',
                            '.send-btn',
                            '.submit-btn',
                            'button[aria-label="Send"]'
                        ];

                        for (const sendSelector of sendSelectors) {
                            if (await waitForElement(page, sendSelector, 3000)) {
                                await page.click(sendSelector);
                                console.log('   ✅ Question sent');
                                questionsAnswered++;
                                await sleep(3000);
                                await takeScreenshot(page, `zantara-v2-question-${i + 1}.png`);
                                break;
                            }
                        }
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            if (!currentInputFound) {
                console.log('   ⚠️ Input field not found for this question');
            }

            await sleep(2000); // Wait between questions
        }

        // Final screenshot
        await takeScreenshot(page, 'zantara-v2-final-state.png');

        console.log('🎉 ZANTARA WebApp Test Completed!');
        console.log(`📊 Questions attempted: ${questionsAnswered}/${Math.min(5, TEST_QUESTIONS.length)}`);
        console.log('📸 Screenshots saved for analysis');

    } catch (error) {
        console.error('❌ Error during test:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
runZantaraTest().catch(console.error);