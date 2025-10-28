#!/usr/bin/env node
/**
 * Lightweight login test runner using Playwright.
 *
 * Usage:
 *   1) npm install playwright
 *   2) export WEBAPP_URL=https://your-webapp.example
 *   3) export ZANTARA_URL=https://zantara.balizero.com
 *   4) node scripts/login_test_runner.js
 *
 * The script reads `scripts/users.json` and attempts to login to each target URL
 * capturing success/failure, screenshots on failures and a JSON results file.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const USERS_FILE = path.join(__dirname, 'users.json');
const OUT_DIR = path.join(__dirname, 'results');
const OUT_FILE = path.join(OUT_DIR, 'login-results.json');

const WEBAPP_URL = process.env.WEBAPP_URL || 'https://webapp.local';
const ZANTARA_URL = process.env.ZANTARA_URL || 'https://zantara.balizero.com';
const TARGETS = [ { name: 'webapp', url: WEBAPP_URL }, { name: 'zantara', url: ZANTARA_URL } ];

async function ensureOut() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    console.error('Missing users.json at', USERS_FILE);
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

async function tryLogin(page, url, user) {
  const start = Date.now();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Try common selectors for email and pin
    const emailSelectors = ['input[type=email]', 'input[name=email]', 'input[name=username]', 'input[id=email]'];
    const pinSelectors = ['input[type=password]', 'input[name=pin]', 'input[name=password]', 'input[id=pin]'];

    let emailHandle = null;
    for (const s of emailSelectors) {
      const el = await page.$(s);
      if (el) { emailHandle = s; break; }
    }
    let pinHandle = null;
    for (const s of pinSelectors) {
      const el = await page.$(s);
      if (el) { pinHandle = s; break; }
    }

    if (!emailHandle || !pinHandle) {
      // Give one more shot: try common login form
      const form = await page.$('form');
      if (form) {
        // attempt to fill first two inputs
        const inputs = await form.$$('input');
        if (inputs.length >= 2) {
          await inputs[0].fill(user.email.toString());
          await inputs[1].fill(user.pin.toString());
        }
      }
    } else {
      await page.fill(emailHandle, user.email.toString());
      await page.fill(pinHandle, user.pin.toString());
    }

    // Try to click a submit button
    const submitSelectors = ['button[type=submit]', 'button:has-text("Login")', 'button:has-text("Accedi")', 'button.login-button'];
    let clicked = false;
    for (const s of submitSelectors) {
      const b = await page.$(s);
      if (b) { await b.click(); clicked = true; break; }
    }
    if (!clicked) {
      // Press Enter
      await page.keyboard.press('Enter');
    }

    // Wait for a success indicator: logout, dashboard, profile, or redirect
    const successIndicators = ['text=Logout', 'text=logout', 'text=Dashboard', 'text=Profile', 'nav', 'a[href*="/logout"]'];
    try {
      await page.waitForSelector(successIndicators.join(','), { timeout: 15000 });
      const time = Date.now() - start;
      return { ok: true, time };
    } catch (e) {
      // not found, consider reading cookies or url change
      const currentUrl = page.url();
      if (currentUrl !== url) {
        const time = Date.now() - start;
        return { ok: true, time, note: 'URL changed after submit' };
      }
      const time = Date.now() - start;
      return { ok: false, time, note: 'No success indicators found' };
    }

  } catch (err) {
    return { ok: false, error: err.message, stack: err.stack };
  }
}

async function run() {
  await ensureOut();
  const users = loadUsers();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results = [];

  for (const user of users) {
    const userResult = { user: { email: user.email, role: user.role }, attempts: [] };
    for (const target of TARGETS) {
      const page = await context.newPage();
      const r = await tryLogin(page, target.url, user);
      if (!r.ok) {
        const safeName = `${user.email.replace(/[^a-z0-9]/gi,'_')}_${target.name}.png`;
        const screenshotPath = path.join(OUT_DIR, safeName);
        try { await page.screenshot({ path: screenshotPath, fullPage: true }); r.screenshot = screenshotPath; } catch(e){}
      }
      userResult.attempts.push({ target: target.name, url: target.url, result: r });
      await page.close();
    }
    results.push(userResult);
  }

  await browser.close();
  fs.writeFileSync(OUT_FILE, JSON.stringify({ runAt: new Date().toISOString(), webapp: WEBAPP_URL, zantara: ZANTARA_URL, results }, null, 2));
  console.log('Results written to', OUT_FILE);
  // exit code non-zero if any failure
  const anyFail = results.some(u => u.attempts.some(a => !a.result.ok));
  process.exit(anyFail ? 1 : 0);
}

run().catch(err => {
  console.error(err);
  process.exit(2);
});
