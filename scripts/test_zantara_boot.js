// scripts/test_zantara_boot.js
import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log("🚀 Opening ZANTARA login...");
  await page.goto("https://zantara.balizero.com/login", { waitUntil: "domcontentloaded" });

  await page.fill('input[name="name"]', "Zero");
  await page.fill('input[name="email"]', "zero@balizero.com");
  await page.fill('input[name="pin"]', "010719");
  await page.click('button[type="submit"]');

  console.log("🔐 Logged in, waiting for dashboard...");
  await page.waitForURL("**/dashboard", { timeout: 20000 });
  console.log("🌐 Dashboard loaded. Testing SSE connection...");

  await page.evaluate(() => {
    const source = new EventSource("https://nuzantara-rag.fly.dev/bali-zero/chat-stream?query=ping");
    source.onmessage = (e) => console.log("✅ SSE EVENT:", e.data);
    source.onerror = (e) => console.error("❌ SSE ERROR:", e);
  });

  console.log("👀 Browser will stay open — watch the console in DevTools for live SSE events.");
})();