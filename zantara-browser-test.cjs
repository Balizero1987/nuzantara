#!/usr/bin/env node

/**
 * ZANTARA Browser Automation Test
 * 50 domande con profilo Zero per testare il sistema di logging
 */

const { chromium } = require('playwright');

const TEST_QUESTIONS = [
    // Business Intelligence & Strategy
    "Qual è la strategia di business per il prossimo trimestre?",
    "Analizza i trend di mercato del settore AI in Indonesia",
    "Come possiamo ottimizzare i costi operativi?",
    "Quali sono le metriche KPI più importanti da monitorare?",
    "Proponi un piano di espansione per il mercato asiatico",

    // Technical & Development
    "Qual è la roadmap tecnologica per i prossimi 6 mesi?",
    "Come possiamo migliorare la performance del sistema?",
    "Quali tecnologie dovremmo adottare per rimanere competitivi?",
    "Analizza l'architettura attuale e proponi miglioramenti",
    "Come possiamo scalare il sistema per 1M+ utenti?",

    // Marketing & Sales
    "Qual è la strategia di marketing per il lancio di nuovi prodotti?",
    "Come possiamo migliorare il tasso di conversione?",
    "Quali canali di vendita sono più efficaci nel nostro settore?",
    "Analizza la concorrenza e proponi strategie di differenziazione",
    "Come possiamo aumentare il customer lifetime value?",

    // Operations & Management
    "Quali processi operativi possiamo automatizzare?",
    "Come possiamo migliorare l'efficienza del team?",
    "Quali sono le best practice per il remote work?",
    "Analizza i flussi di lavoro e proponi ottimizzazioni",
    "Come possiamo implementare un sistema di performance management?",

    // Financial & Investment
    "Qual è la situazione finanziaria attuale e le proiezioni?",
    "Come possiamo ottimizzare la gestione della cassa?",
    "Quali opportunità di investimento dovremmo considerare?",
    "Analizza i margini di profitto e proponi strategie di miglioramento",
    "Come possiamo strutturare un piano di fundraising?",

    // Innovation & R&D
    "Quali aree di innovazione dovremmo esplorare?",
    "Come possiamo implementare una cultura dell'innovazione?",
    "Quali tecnologie emergenti potrebbero impattare il nostro business?",
    "Analizza le tendenze del mercato e identifica opportunità",
    "Come possiamo proteggere la proprietà intellettuale?",

    // Customer Experience
    "Come possiamo migliorare la customer journey?",
    "Quali sono i pain point principali dei nostri clienti?",
    "Come possiamo implementare un sistema di feedback efficace?",
    "Analizza i dati clienti e proponi personalizzazioni",
    "Come possiamo ridurre il churn rate?",

    // Risk Management
    "Quali sono i principali rischi aziendali e come mitigarli?",
    "Come possiamo implementare un sistema di compliance?",
    "Quali scenari di crisi dovremmo preparare?",
    "Analizza i rischi operativi e strategie di continuità",
    "Come possiamo proteggere i dati aziendali?",

    // Future Vision
    "Come vedi l'azienda tra 5 anni?",
    "Quali megatrend dovremo monitorare?",
    "Come possiamo preparaci per le future sfide del mercato?",
    "Qual è la visione a lungo termine per il business?",
    "Come possiamo bilanciare crescita e sostenibilità?",

    // Strategic Partnerships
    "Quali partnership strategiche dovremo considerare?",
    "Come possiamo strutturare alleanze vantaggiose?",
    "Quali sono i criteri per selezionare partner ideali?",
    "Come possiamo gestire le relazioni con i partner chiave?",
    "Quali opportunità di co-creazione possiamo esplorare?",

    // Performance Analytics
    "Come possiamo implementare analytics avanzati per il business?",
    "Quali dashboard sono essenziali per il management?",
    "Come possiamo trasformare i dati in insight azionabili?",
    "Quali metriche predittive possiamo implementare?",
    "Come creare un sistema di business intelligence in real-time?"
];

async function runZantaraTest() {
    console.log('🚀 ZANTARA Browser Automation - Starting 50 Test Questions');
    console.log('👤 Profile: Zero (zero@balizero.com)');
    console.log('🔑 PIN: 010719');
    console.log('=====================================\n');

    const browser = await chromium.launch({
        headless: false, // Visual mode per debugging
        slowMo: 1000 // Slow motion per vedere l'azione
    });

    try {
        const page = await browser.newPage();

        // Navigate to ZANTARA
        console.log('📍 Navigating to ZANTARA...');
        await page.goto('https://nuzantara-backend.fly.dev/', { waitUntil: 'networkidle' });

        // Wait for page to load
        await page.waitForTimeout(3000);

        // Take screenshot before login
        await page.screenshot({ path: 'zantara-before-login.png' });
        console.log('📸 Screenshot saved: zantara-before-login.png');

        // Look for login form
        console.log('🔍 Looking for login form...');

        // Try to find and click login button or navigate to login
        try {
            // Look for login elements
            const loginButton = await page.locator('text=Login', 'text=Accedi', 'text=Entra', 'button').first();

            if (await loginButton.isVisible()) {
                console.log('✅ Found login button, clicking...');
                await loginButton.click();
                await page.waitForTimeout(2000);
            }

            // Look for form fields
            const nameField = await page.locator('input[name*="name"], input[placeholder*="name"], input[type="text"]').first();
            const emailField = await page.locator('input[name*="email"], input[placeholder*="email"], input[type="email"]').first();
            const pinField = await page.locator('input[name*="pin"], input[placeholder*="pin"], input[type="password"], input[type="text"]').first();

            if (await nameField.isVisible()) {
                console.log('✅ Found name field');
                await nameField.fill('Zero');
                await page.waitForTimeout(1000);
            }

            if (await emailField.isVisible()) {
                console.log('✅ Found email field');
                await emailField.fill('zero@balizero.com');
                await page.waitForTimeout(1000);
            }

            if (await pinField.isVisible()) {
                console.log('✅ Found PIN field');
                await pinField.fill('010719');
                await page.waitForTimeout(1000);

                // Look for submit button
                const submitButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Accedi"), button:has-text("Entra")').first();
                if (await submitButton.isVisible()) {
                    console.log('✅ Found submit button, clicking...');
                    await submitButton.click();
                    await page.waitForTimeout(5000);
                }
            }

        } catch (error) {
            console.log('⚠️ Login form not found, continuing with direct API testing...');
        }

        // Take screenshot after login attempt
        await page.screenshot({ path: 'zantara-after-login.png' });
        console.log('📸 Screenshot saved: zantara-after-login.png');

        // Test 50 questions
        console.log('\n🎯 Starting 50 Test Questions...\n');

        for (let i = 0; i < TEST_QUESTIONS.length; i++) {
            const question = TEST_QUESTIONS[i];
            console.log(`Question ${i + 1}/50: ${question.substring(0, 60)}...`);

            try {
                // Look for input field or chat interface
                const inputField = await page.locator('textarea, input[type="text"], input[name*="prompt"], input[placeholder*="message"]').first();

                if (await inputField.isVisible()) {
                    await inputField.fill(question);
                    await page.waitForTimeout(1000);

                    // Look for submit/send button
                    const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Invia"), button:has-text("Ask")').first();
                    if (await sendButton.isVisible()) {
                        await sendButton.click();
                        await page.waitForTimeout(3000);
                    }
                } else {
                    console.log('   ⚠️ Input field not found, skipping...');
                }

                // Screenshot after each question
                await page.screenshot({ path: `zantara-question-${i + 1}.png` });

            } catch (error) {
                console.log(`   ❌ Error on question ${i + 1}: ${error.message}`);
            }

            // Small delay between questions
            await page.waitForTimeout(2000);
        }

        // Final screenshot
        await page.screenshot({ path: 'zantara-final-state.png' });
        console.log('\n📸 Final screenshot saved: zantara-final-state.png');

        console.log('\n🎉 ZANTARA Browser Test Completed!');
        console.log('📊 Screenshots saved for analysis');

    } catch (error) {
        console.error('❌ Error during browser automation:', error);
    } finally {
        await browser.close();
        console.log('🔒 Browser closed');
    }
}

// Run the test
runZantaraTest().catch(console.error);