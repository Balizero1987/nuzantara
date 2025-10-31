#!/usr/bin/env node
/**
 * ZANTARA Auto-Monitor Script with Video Recording
 * Performs daily health checks with full audit trail
 * Part of ZANTARA-PERFECT-100 Release
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";

// Configuration
const OUTPUT_DIR = "/tmp/zantara_audit_videos";
const LOG_FILE = "/tmp/ZANTARA_AUTOMONITOR.log";
const CRON_LOG = "/tmp/ZANTARA_AUTOMONITOR_CRON.log";

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Generate timestamp for this run
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const videoPath = path.join(OUTPUT_DIR, `ZANTARA_AUDIT_${timestamp}.webm`);
const screenshotPath = path.join(OUTPUT_DIR, `ZANTARA_AUDIT_${timestamp}.png`);

// Performance metrics
const metrics = {
  startTime: Date.now(),
  loginTime: 0,
  dashboardTime: 0,
  healthCheckTime: 0,
  sseLatency: 0,
  totalTime: 0,
  status: "PENDING"
};

/**
 * Log message to both console and file
 */
function log(message, level = "INFO") {
  const logEntry = `[${new Date().toISOString()}] [${level}] ${message}`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE, logEntry + "\n");
}

/**
 * Main monitoring function
 */
async function runAudit() {
  let browser;
  let context;
  let page;

  try {
    log("🚀 ZANTARA Auto-Monitor starting...");
    log(`📹 Video will be saved to: ${videoPath}`);

    // Launch browser with video recording
    browser = await chromium.launch({
      headless: true,  // Set to false for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create context with video recording
    context = await browser.newContext({
      recordVideo: {
        dir: OUTPUT_DIR,
        size: { width: 1280, height: 720 }
      },
      viewport: { width: 1280, height: 720 },
      userAgent: 'ZANTARA-Monitor/1.0 (Automated Health Check)'
    });

    page = await context.newPage();

    // Step 1: Navigate to login page
    log("📍 Step 1: Navigating to ZANTARA login page...");
    const loginStart = performance.now();

    await page.goto("https://zantara.balizero.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    // Step 2: Perform login
    log("🔐 Step 2: Performing automated login...");
    await page.fill('input[name="name"]', "Zero");
    await page.fill('input[name="email"]', "zero@balizero.com");
    await page.fill('input[name="pin"]', "010719");

    // Click submit button
    await page.click('button[type="submit"]');

    // Wait for dashboard
    try {
      await page.waitForURL("**/dashboard", { timeout: 30000 });
      metrics.loginTime = performance.now() - loginStart;
      log(`✅ Login successful in ${metrics.loginTime.toFixed(2)}ms`);
    } catch (error) {
      // If no redirect, check if we're on chat page (alternative flow)
      const currentUrl = page.url();
      if (currentUrl.includes("chat")) {
        metrics.loginTime = performance.now() - loginStart;
        log(`✅ Login successful (redirected to chat) in ${metrics.loginTime.toFixed(2)}ms`);
      } else {
        throw new Error(`Login failed - unexpected URL: ${currentUrl}`);
      }
    }

    // Step 3: Test backend health endpoints
    log("🏥 Step 3: Testing backend health endpoints...");
    const healthStart = performance.now();

    const healthResults = await page.evaluate(async () => {
      const endpoints = [
        "https://nuzantara-rag.fly.dev/health",
        "https://nuzantara-rag.fly.dev/cache/health",
        "https://nuzantara-backend.fly.dev/health"
      ];

      const results = {};

      for (const endpoint of endpoints) {
        try {
          const t0 = performance.now();
          const response = await fetch(endpoint);
          const latency = performance.now() - t0;
          const data = await response.json();

          results[endpoint] = {
            status: response.ok,
            statusCode: response.status,
            latency: latency.toFixed(2),
            data: data
          };
        } catch (error) {
          results[endpoint] = {
            status: false,
            error: error.message
          };
        }
      }

      return results;
    });

    metrics.healthCheckTime = performance.now() - healthStart;
    log(`📊 Health check completed in ${metrics.healthCheckTime.toFixed(2)}ms`);

    // Log individual health check results
    for (const [endpoint, result] of Object.entries(healthResults)) {
      const status = result.status ? "✅" : "❌";
      const latency = result.latency ? `${result.latency}ms` : "N/A";
      log(`  ${status} ${endpoint.split("/").pop()}: ${latency}`);
    }

    // Step 4: Test SSE connection
    log("📡 Step 4: Testing SSE streaming connection...");
    const sseStart = performance.now();

    const sseResult = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const eventSource = new EventSource(
          "https://nuzantara-rag.fly.dev/bali-zero/chat-stream?query=ping&user_id=monitor"
        );

        const result = {
          connected: false,
          firstMessageTime: 0,
          messagesReceived: 0,
          error: null
        };

        const timeout = setTimeout(() => {
          eventSource.close();
          resolve(result);
        }, 10000); // 10 second timeout

        eventSource.onopen = () => {
          result.connected = true;
          result.firstMessageTime = performance.now();
        };

        eventSource.onmessage = (event) => {
          result.messagesReceived++;
          if (result.messagesReceived >= 3) {
            clearTimeout(timeout);
            eventSource.close();
            resolve(result);
          }
        };

        eventSource.onerror = (error) => {
          result.error = "SSE connection error";
          clearTimeout(timeout);
          eventSource.close();
          resolve(result);
        };
      });
    });

    metrics.sseLatency = performance.now() - sseStart;

    if (sseResult.connected) {
      log(`✅ SSE connection successful (${sseResult.messagesReceived} messages in ${metrics.sseLatency.toFixed(2)}ms)`);
    } else {
      log(`❌ SSE connection failed: ${sseResult.error || "Timeout"}`);
    }

    // Step 5: Take full-page screenshot
    log("📸 Step 5: Capturing screenshot...");
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    log(`✅ Screenshot saved: ${screenshotPath}`);

    // Step 6: Calculate final metrics
    metrics.totalTime = Date.now() - metrics.startTime;
    metrics.status = "SUCCESS";

    // Calculate operational score
    let score = 0;
    if (metrics.loginTime > 0 && metrics.loginTime < 5000) score += 25;
    if (healthResults["https://nuzantara-rag.fly.dev/health"]?.status) score += 25;
    if (healthResults["https://nuzantara-backend.fly.dev/health"]?.status) score += 25;
    if (sseResult.connected) score += 25;

    log("═══════════════════════════════════════════════════════════");
    log(`🎯 AUDIT COMPLETE - Score: ${score}/100`);
    log(`⏱️  Total execution time: ${metrics.totalTime}ms`);
    log(`📹 Video saved: ${videoPath}`);
    log(`📸 Screenshot saved: ${screenshotPath}`);
    log("═══════════════════════════════════════════════════════════");

    // Write summary to file
    const summary = {
      timestamp: new Date().toISOString(),
      score: score,
      metrics: metrics,
      healthChecks: healthResults,
      sse: sseResult,
      files: {
        video: videoPath,
        screenshot: screenshotPath
      }
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `ZANTARA_AUDIT_${timestamp}.json`),
      JSON.stringify(summary, null, 2)
    );

  } catch (error) {
    metrics.status = "FAILED";
    metrics.error = error.message;
    log(`❌ AUDIT FAILED: ${error.message}`, "ERROR");
    log(error.stack, "ERROR");
  } finally {
    // Clean up
    if (page) {
      try {
        await page.close();
      } catch (e) {
        log(`Warning: Failed to close page: ${e.message}`, "WARN");
      }
    }

    if (context) {
      try {
        await context.close();
      } catch (e) {
        log(`Warning: Failed to close context: ${e.message}`, "WARN");
      }
    }

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        log(`Warning: Failed to close browser: ${e.message}`, "WARN");
      }
    }

    // Exit with appropriate code
    process.exit(metrics.status === "SUCCESS" ? 0 : 1);
  }
}

// Check if Playwright browsers are installed
async function checkPlaywrightInstallation() {
  try {
    const browserPath = chromium.executablePath();
    if (!fs.existsSync(browserPath)) {
      log("⚠️ Playwright browsers not found. Installing...", "WARN");
      const { execSync } = await import("child_process");
      execSync("npx playwright install chromium", { stdio: "inherit" });
      log("✅ Playwright browsers installed successfully");
    }
  } catch (error) {
    log(`Failed to check/install Playwright: ${error.message}`, "ERROR");
  }
}

// Main execution
(async () => {
  try {
    await checkPlaywrightInstallation();
    await runAudit();
  } catch (error) {
    log(`Fatal error: ${error.message}`, "ERROR");
    process.exit(1);
  }
})();