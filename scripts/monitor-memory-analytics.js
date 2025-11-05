#!/usr/bin/env node

/**
 * MEMORY SERVICE ANALYTICS MONITOR
 *
 * Real-time monitoring dashboard for Memory Service analytics
 * Shows comprehensive metrics, performance data, and trends
 *
 * Usage:
 *   node scripts/monitor-memory-analytics.js
 *   node scripts/monitor-memory-analytics.js --days=30
 *   node scripts/monitor-memory-analytics.js --realtime
 */

/* eslint-disable no-undef */ // fetch, setInterval are built-in in Node 18+
/* eslint-disable no-console */ // Console statements needed for dashboard output

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'https://nuzantara-memory.fly.dev';

// Parse command line arguments
const args = process.argv.slice(2);
const daysMatch = args.find((arg) => arg.startsWith('--days='));
const days = daysMatch ? parseInt(daysMatch.split('=')[1]) : 7;
const realtimeOnly = args.includes('--realtime');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toString();
}

function formatPercent(decimal) {
  return `${(decimal * 100).toFixed(1)}%`;
}

function printHeader(title) {
  console.log('');
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log('');
}

function printSection(title) {
  console.log('');
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.dim}${'-'.repeat(60)}${colors.reset}`);
}

function printMetric(label, value, color = colors.white, unit = '') {
  const paddedLabel = label.padEnd(35);
  console.log(
    `  ${colors.dim}${paddedLabel}${colors.reset} ${color}${value}${unit}${colors.reset}`
  );
}

function printBar(label, value, max, color = colors.green) {
  const barWidth = 30;
  const filled = Math.round((value / max) * barWidth);
  const empty = barWidth - filled;

  const bar = color + '█'.repeat(filled) + colors.dim + '░'.repeat(empty) + colors.reset;

  console.log(`  ${label.padEnd(20)} ${bar} ${colors.bright}${value}${colors.reset}`);
}

async function fetchRealTimeMetrics() {
  try {
    const response = await fetch(`${MEMORY_SERVICE_URL}/api/analytics/realtime`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch real-time metrics');
    }

    return data.realtime;
  } catch (error) {
    console.error(
      `${colors.red}❌ Failed to fetch real-time metrics:${colors.reset}`,
      error.message
    );
    return null;
  }
}

async function fetchComprehensiveAnalytics(days) {
  try {
    const response = await fetch(`${MEMORY_SERVICE_URL}/api/analytics/comprehensive?days=${days}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch analytics');
    }

    return data.analytics;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to fetch analytics:${colors.reset}`, error.message);
    return null;
  }
}

function displayRealTimeMetrics(metrics) {
  printSection('📊 REAL-TIME METRICS (Last 5 Minutes)');

  printMetric('Messages per Minute', metrics.messagesPerMinute.toFixed(2), colors.green);
  printMetric('Retrievals per Minute', metrics.retrievalsPerMinute.toFixed(2), colors.blue);
  printMetric('Active Sessions', metrics.activeSessions, colors.yellow);
  printMetric('Timestamp', metrics.timestamp, colors.dim);
}

function displayComprehensiveAnalytics(analytics, days) {
  // Usage Metrics
  printSection('📈 USAGE METRICS');

  printMetric('Total Sessions', formatNumber(analytics.totalSessions), colors.cyan);
  printMetric('Active Sessions', formatNumber(analytics.activeSessions), colors.green);
  printMetric('Total Messages', formatNumber(analytics.totalMessages), colors.blue);
  printMetric('Unique Users', formatNumber(analytics.uniqueUsers), colors.magenta);

  printSection(`📅 LAST 24 HOURS`);

  printMetric('Messages (24h)', formatNumber(analytics.messagesLast24h), colors.yellow);
  printMetric('Sessions (24h)', formatNumber(analytics.sessionsLast24h), colors.yellow);

  // Conversation Metrics
  printSection('💬 CONVERSATION METRICS');

  printMetric(
    'Avg Conversation Length',
    analytics.avgConversationLength.toFixed(1),
    colors.cyan,
    ' messages'
  );
  printMetric('Longest Conversation', analytics.longestConversation, colors.green, ' messages');
  printMetric('Avg Messages per Session', analytics.avgMessagesPerSession.toFixed(1), colors.blue);

  // Performance Metrics
  printSection('⚡ PERFORMANCE METRICS');

  const cacheHitColor =
    analytics.cacheHitRate > 0.7
      ? colors.green
      : analytics.cacheHitRate > 0.4
        ? colors.yellow
        : colors.red;
  printMetric('Cache Hit Rate', formatPercent(analytics.cacheHitRate), cacheHitColor);

  // Memory Effectiveness
  printSection('🧠 MEMORY EFFECTIVENESS');

  const memoryHitColor =
    analytics.memoryHitRate > 0.5
      ? colors.green
      : analytics.memoryHitRate > 0.3
        ? colors.yellow
        : colors.red;
  printMetric('Memory Hit Rate', formatPercent(analytics.memoryHitRate), memoryHitColor);
  printMetric(
    'Avg History Retrieved',
    analytics.avgHistoryRetrieved.toFixed(1),
    colors.blue,
    ' messages'
  );

  // Daily Trends
  if (analytics.dailyStats && analytics.dailyStats.length > 0) {
    printSection(`📊 DAILY TRENDS (Last ${days} Days)`);

    const maxMessages = Math.max(...analytics.dailyStats.map((d) => d.messages));
    const maxSessions = Math.max(...analytics.dailyStats.map((d) => d.sessions));

    // Show last 7 days
    analytics.dailyStats.slice(0, 7).forEach((day) => {
      console.log(
        `\n  ${colors.bright}${day.date}${colors.reset} ${colors.dim}(${day.users} users)${colors.reset}`
      );
      printBar('  Messages', day.messages, maxMessages, colors.blue);
      printBar('  Sessions', day.sessions, maxSessions, colors.green);
    });
  }

  // Hourly Distribution
  if (analytics.hourlyDistribution && analytics.hourlyDistribution.length > 0) {
    printSection('🕐 HOURLY DISTRIBUTION (Last 24 Hours)');

    const maxRequests = Math.max(...analytics.hourlyDistribution.map((h) => h.requests));

    // Group into time blocks
    const timeBlocks = {
      'Night (00-06)': analytics.hourlyDistribution.filter((h) => h.hour >= 0 && h.hour < 6),
      'Morning (06-12)': analytics.hourlyDistribution.filter((h) => h.hour >= 6 && h.hour < 12),
      'Afternoon (12-18)': analytics.hourlyDistribution.filter((h) => h.hour >= 12 && h.hour < 18),
      'Evening (18-24)': analytics.hourlyDistribution.filter((h) => h.hour >= 18 && h.hour < 24),
    };

    Object.entries(timeBlocks).forEach(([label, hours]) => {
      const total = hours.reduce((sum, h) => sum + h.requests, 0);
      if (total > 0) {
        printBar(label, total, maxRequests * 6, colors.magenta);
      }
    });
  }

  // Health Status
  printSection('🏥 HEALTH STATUS');

  const healthIndicators = [];

  // Cache health
  if (analytics.cacheHitRate > 0.7) {
    healthIndicators.push(
      `${colors.green}✓ Cache performing well (${formatPercent(analytics.cacheHitRate)} hit rate)${colors.reset}`
    );
  } else if (analytics.cacheHitRate > 0.4) {
    healthIndicators.push(
      `${colors.yellow}⚠ Cache could be improved (${formatPercent(analytics.cacheHitRate)} hit rate)${colors.reset}`
    );
  } else {
    healthIndicators.push(
      `${colors.red}✗ Cache needs attention (${formatPercent(analytics.cacheHitRate)} hit rate)${colors.reset}`
    );
  }

  // Memory usage
  if (analytics.memoryHitRate > 0.5) {
    healthIndicators.push(
      `${colors.green}✓ Memory being used effectively (${formatPercent(analytics.memoryHitRate)})${colors.reset}`
    );
  } else if (analytics.memoryHitRate > 0.3) {
    healthIndicators.push(
      `${colors.yellow}⚠ Memory usage moderate (${formatPercent(analytics.memoryHitRate)})${colors.reset}`
    );
  } else {
    healthIndicators.push(
      `${colors.yellow}ℹ Memory usage low (${formatPercent(analytics.memoryHitRate)}) - may be normal for new deployments${colors.reset}`
    );
  }

  // Activity level
  if (analytics.messagesLast24h > 100) {
    healthIndicators.push(
      `${colors.green}✓ High activity (${analytics.messagesLast24h} messages/24h)${colors.reset}`
    );
  } else if (analytics.messagesLast24h > 20) {
    healthIndicators.push(
      `${colors.blue}ℹ Moderate activity (${analytics.messagesLast24h} messages/24h)${colors.reset}`
    );
  } else {
    healthIndicators.push(
      `${colors.dim}ℹ Low activity (${analytics.messagesLast24h} messages/24h)${colors.reset}`
    );
  }

  healthIndicators.forEach((indicator) => {
    console.log(`  ${indicator}`);
  });
}

async function main() {
  printHeader('🧠 NUZANTARA MEMORY SERVICE ANALYTICS');

  console.log(`${colors.dim}Service: ${MEMORY_SERVICE_URL}${colors.reset}`);
  console.log(`${colors.dim}Period: Last ${days} days${colors.reset}`);
  console.log(`${colors.dim}Time: ${new Date().toISOString()}${colors.reset}`);

  if (realtimeOnly) {
    // Real-time monitoring mode
    console.log(`\n${colors.yellow}Real-time monitoring mode (updates every 30s)${colors.reset}`);
    console.log(`${colors.dim}Press Ctrl+C to exit${colors.reset}`);

    const monitor = async () => {
      const metrics = await fetchRealTimeMetrics();
      if (metrics) {
        console.clear();
        printHeader('🧠 MEMORY SERVICE - REAL-TIME MONITOR');
        displayRealTimeMetrics(metrics);
      }
    };

    // Initial fetch
    await monitor();

    // Update every 30 seconds
    setInterval(monitor, 30000);
  } else {
    // Full analytics display
    const [realtime, comprehensive] = await Promise.all([
      fetchRealTimeMetrics(),
      fetchComprehensiveAnalytics(days),
    ]);

    if (realtime) {
      displayRealTimeMetrics(realtime);
    }

    if (comprehensive) {
      displayComprehensiveAnalytics(comprehensive, days);
    }

    console.log('');
    console.log(`${colors.dim}${'='.repeat(70)}${colors.reset}`);
    console.log('');
    console.log(`${colors.green}✅ Analytics fetched successfully!${colors.reset}`);
    console.log('');
    console.log(`${colors.dim}Run with --realtime for live monitoring${colors.reset}`);
    console.log(`${colors.dim}Run with --days=30 for longer time period${colors.reset}`);
    console.log('');
  }
}

main().catch((error) => {
  console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error);
  process.exit(1);
});
