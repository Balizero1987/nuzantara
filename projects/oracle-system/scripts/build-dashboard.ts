#!/usr/bin/env tsx
import { buildDashboardReport, persistDashboardReport } from '../agents/utils/intel-dashboard';
import { todayStamp } from '../agents/utils/intel-processor';

const DEFAULT_AGENTS = ['visa-oracle', 'kbli-eye'];

async function main() {
  const dateArg = process.argv[2];
  const dateStamp = dateArg || todayStamp();

  const report = await buildDashboardReport(DEFAULT_AGENTS, dateStamp);
  const filePath = await persistDashboardReport(report);

  console.log(`Dashboard generated for ${dateStamp}`);
  console.log(`Records: ${report.totals.records} | Alerts: ${report.totals.alerts}`);
  console.log(`Saved to ${filePath}`);
}

main().catch(error => {
  console.error('Failed to build dashboard:', error);
  process.exit(1);
});

