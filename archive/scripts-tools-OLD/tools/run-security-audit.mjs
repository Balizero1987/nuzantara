#!/usr/bin/env node

/**
 * Security Audit Runner
 * Execute comprehensive security analysis
 */

import { SecurityAuditor } from './security-auditor.js';
import { writeFileSync } from 'fs';

async function runSecurityAudit() {
  console.log('🔒 NUZANTARA Security Audit Starting...\n');
  
  const auditor = new SecurityAuditor('./src');
  const issues = await auditor.runFullAudit();
  
  // Generate report
  const report = auditor.generateReport();
  
  // Save to file
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `SECURITY_AUDIT_${timestamp}.md`;
  writeFileSync(filename, report);
  
  // Console summary
  console.log('\n📊 Security Audit Complete!');
  console.log(`📁 Report saved: ${filename}`);
  console.log(`🔍 Total issues found: ${issues.length}`);
  
  const criticalCount = issues.filter(i => i.type === 'CRITICAL').length;
  const highCount = issues.filter(i => i.type === 'HIGH').length;
  const mediumCount = issues.filter(i => i.type === 'MEDIUM').length;
  
  console.log(`🔴 Critical: ${criticalCount}`);
  console.log(`🟠 High: ${highCount}`);
  console.log(`🟡 Medium: ${mediumCount}`);
  
  if (criticalCount > 0) {
    console.log('\n⚠️  CRITICAL ISSUES DETECTED - IMMEDIATE ACTION REQUIRED!');
    process.exit(1);
  } else if (highCount > 0) {
    console.log('\n⚠️  High priority issues found - Review recommended');
    process.exit(0);
  } else {
    console.log('\n✅ No critical security issues detected');
    process.exit(0);
  }
}

runSecurityAudit().catch(error => {
  console.error('❌ Security audit failed:', error);
  process.exit(1);
});