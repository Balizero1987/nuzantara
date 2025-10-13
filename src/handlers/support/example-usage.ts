/**
 * Complaint System - Example Usage
 * Esempi pratici di utilizzo del sistema di gestione reclami
 */

import { submitComplaint, getComplaint, updateComplaintStatus, listComplaints, getComplaintStats } from './complaint-handler';

/**
 * Example 1: Customer complaint about subscription/usage
 * Scenario reale: cliente paga per PRO+ ma riceve avvisi di usage
 */
async function exampleSubscriptionUsageComplaint() {
  console.log('\n=== Example 1: Subscription Usage Complaint ===\n');

  // Submit complaint
  const result = await submitComplaint({
    userId: 'user_antonio',
    type: 'subscription',
    subject: 'Usage warning immediately after PRO+ payment',
    description: 'Ho pagato 60 dollari 2 ore fa per PRO+ e tu mi mandi un messaggio che sto per finire lo usage. Questa è una truffa!',
    metadata: {
      subscriptionPlan: 'PRO+',
      paymentAmount: 60,
      paymentDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      usagePercentage: 95,
      expectedBehavior: 'Full quota reset after payment',
      actualBehavior: 'Received usage warning 2 hours after payment'
    }
  });

  console.log('✅ Complaint submitted successfully');
  console.log('Complaint ID:', result.data.complaintId);
  console.log('Severity:', result.data.severity); // Expected: "critical" (keyword "truffa")
  console.log('Status:', result.data.status);
  console.log('Response Time:', result.data.estimatedResponseTime);
  console.log('Message:', result.data.message);
  console.log('Next Steps:', result.data.nextSteps);

  return result.data.complaintId;
}

/**
 * Example 2: Support team updates complaint status
 */
async function exampleUpdateComplaintStatus(complaintId: string) {
  console.log('\n=== Example 2: Update Complaint Status ===\n');

  // Support team acknowledges the complaint
  await updateComplaintStatus({
    complaintId,
    status: 'acknowledged',
    note: 'Complaint received and assigned to billing team',
    assignedTo: 'billing-team@balizero.com'
  });

  console.log('✅ Status updated to: acknowledged');

  // Team starts investigating
  await updateComplaintStatus({
    complaintId,
    status: 'investigating',
    note: 'Verified payment. Checking usage quota sync issues.'
  });

  console.log('✅ Status updated to: investigating');

  // Issue resolved
  await updateComplaintStatus({
    complaintId,
    status: 'resolved',
    note: 'Found quota sync bug. Fixed and refunded 1 week of service. Customer quota reset to 100%.'
  });

  console.log('✅ Status updated to: resolved');

  // Retrieve final complaint state
  const complaint = await getComplaint({ complaintId });
  console.log('\nFinal complaint state:');
  console.log('Status:', complaint.data.status);
  console.log('Created:', complaint.data.createdAt);
  console.log('Resolved:', complaint.data.resolvedAt);
  console.log('Notes count:', complaint.data.notes?.length);
}

/**
 * Example 3: List and filter complaints
 */
async function exampleListComplaints() {
  console.log('\n=== Example 3: List and Filter Complaints ===\n');

  // Get all critical complaints
  const criticalComplaints = await listComplaints({
    severity: 'critical',
    limit: 10
  });

  console.log('Critical complaints:', criticalComplaints.data.complaints.length);

  // Get unresolved subscription issues
  const unresolvedSubscription = await listComplaints({
    type: 'subscription',
    status: 'new',
    limit: 20
  });

  console.log('Unresolved subscription complaints:', unresolvedSubscription.data.complaints.length);

  // Get all complaints for a specific user
  const userComplaints = await listComplaints({
    userId: 'user_antonio',
    limit: 50
  });

  console.log('User complaints:', userComplaints.data.complaints.length);

  // Paginated results
  const page1 = await listComplaints({ limit: 5, offset: 0 });
  const page2 = await listComplaints({ limit: 5, offset: 5 });

  console.log('\nPage 1 complaints:', page1.data.complaints.length);
  console.log('Page 2 complaints:', page2.data.complaints.length);
  console.log('Has more?', page1.data.pagination.hasMore);
}

/**
 * Example 4: Analytics and statistics
 */
async function exampleComplaintStats() {
  console.log('\n=== Example 4: Complaint Statistics ===\n');

  // Last 24 hours
  const stats24h = await getComplaintStats({ period: '24h' });
  console.log('Last 24 hours:');
  console.log('  Total:', stats24h.data.total);
  console.log('  By severity:', stats24h.data.bySeverity);
  console.log('  Escalation rate:', stats24h.data.escalationRate.toFixed(2) + '%');

  // Last 7 days
  const stats7d = await getComplaintStats({ period: '7d' });
  console.log('\nLast 7 days:');
  console.log('  Total:', stats7d.data.total);
  console.log('  By type:', stats7d.data.byType);
  console.log('  Average resolution time:', Math.round(stats7d.data.averageResolutionTime / 1000 / 60) + ' minutes');

  // Last 30 days
  const stats30d = await getComplaintStats({ period: '30d' });
  console.log('\nLast 30 days:');
  console.log('  Total:', stats30d.data.total);
  console.log('  By status:', stats30d.data.byStatus);
}

/**
 * Example 5: Different complaint types
 */
async function exampleDifferentComplaintTypes() {
  console.log('\n=== Example 5: Different Complaint Types ===\n');

  // Billing complaint
  const billingComplaint = await submitComplaint({
    type: 'billing',
    subject: 'Double charge on credit card',
    description: 'I was charged twice for the same subscription on October 10th',
    metadata: {
      paymentAmount: 120, // charged twice
      transactionIds: ['tx_123', 'tx_124']
    }
  });
  console.log('Billing complaint severity:', billingComplaint.data.severity);

  // Service complaint
  const serviceComplaint = await submitComplaint({
    type: 'service',
    subject: 'Export feature not working',
    description: 'When I try to export my data, I get an error message',
    metadata: {
      feature: 'data-export',
      errorMessage: 'Failed to generate export file'
    }
  });
  console.log('Service complaint severity:', serviceComplaint.data.severity);

  // Usage complaint
  const usageComplaint = await submitComplaint({
    type: 'usage',
    subject: 'Usage metrics seem incorrect',
    description: 'My dashboard shows 90% usage but I only made 10 API calls today',
    metadata: {
      usagePercentage: 90,
      actualCalls: 10,
      expectedUsage: '~5%'
    }
  });
  console.log('Usage complaint severity:', usageComplaint.data.severity);
}

/**
 * Example 6: Monitoring and alerting (integration pattern)
 */
async function exampleMonitoringIntegration() {
  console.log('\n=== Example 6: Monitoring Integration ===\n');

  // Check critical unresolved complaints
  const critical = await listComplaints({
    severity: 'critical',
    status: 'new'
  });

  if (critical.data.complaints.length >= 5) {
    console.log('⚠️ ALERT: 5+ critical unresolved complaints');
    // In production: Send alert to Slack/PagerDuty
  }

  // Check escalation rate
  const stats = await getComplaintStats({ period: '7d' });
  if (stats.data.escalationRate > 15) {
    console.log('⚠️ ALERT: Escalation rate above threshold:', stats.data.escalationRate.toFixed(2) + '%');
    // In production: Send alert to management
  }

  // Check response time
  const avgResolutionHours = stats.data.averageResolutionTime / 1000 / 60 / 60;
  if (avgResolutionHours > 24) {
    console.log('⚠️ ALERT: Average resolution time:', avgResolutionHours.toFixed(1), 'hours');
    // In production: Send alert to support team lead
  }

  console.log('✅ All monitoring checks completed');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    // Example 1: Submit complaint
    const complaintId = await exampleSubscriptionUsageComplaint();

    // Example 2: Update complaint through workflow
    await exampleUpdateComplaintStatus(complaintId);

    // Example 3: List and filter
    await exampleListComplaints();

    // Example 4: Statistics
    await exampleComplaintStats();

    // Example 5: Different types
    await exampleDifferentComplaintTypes();

    // Example 6: Monitoring
    await exampleMonitoringIntegration();

    console.log('\n=== All Examples Completed Successfully ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
