/**
 * Complaint Handler - Subscription & Usage Issues
 * Handles customer complaints related to subscriptions, usage limits, and billing
 */

import { ok, err } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";

export interface Complaint {
  id: string;
  userId?: string;
  type: 'subscription' | 'usage' | 'billing' | 'service' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  subject: string;
  description: string;
  metadata?: {
    subscriptionPlan?: string;
    paymentAmount?: number;
    paymentDate?: string;
    usagePercentage?: number;
    expectedBehavior?: string;
    actualBehavior?: string;
  };
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'escalated';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  notes?: string[];
}

// In-memory storage (in production, use a database)
const complaints = new Map<string, Complaint>();
const complaintCounter = { count: 0 };

/**
 * Submit a new complaint
 */
export async function submitComplaint(params: any) {
  const {
    userId,
    type = 'other',
    subject,
    description,
    metadata = {}
  } = params || {};

  // Validation
  if (!subject || !description) {
    throw new BadRequestError('Subject and description are required');
  }

  if (!['subscription', 'usage', 'billing', 'service', 'other'].includes(type)) {
    throw new BadRequestError('Invalid complaint type');
  }

  // Calculate severity based on keywords and metadata
  const severity = calculateSeverity(subject, description, metadata);

  // Generate complaint ID
  complaintCounter.count++;
  const complaintId = `COMPLAINT-${Date.now()}-${complaintCounter.count}`;

  // Create complaint object
  const complaint: Complaint = {
    id: complaintId,
    userId,
    type,
    severity,
    subject,
    description,
    metadata,
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store complaint
  complaints.set(complaintId, complaint);

  // Log complaint
  console.log(`🚨 NEW COMPLAINT [${severity.toUpperCase()}]: ${complaintId} - ${subject}`);

  // Auto-escalate critical complaints
  if (severity === 'critical') {
    await escalateComplaint(complaintId, 'Auto-escalated due to critical severity');
  }

  // Send notifications for high/critical severity
  if (severity === 'high' || severity === 'critical') {
    await notifySupport(complaint);
  }

  return ok({
    complaintId,
    status: 'submitted',
    severity,
    message: getResponseMessage(severity),
    estimatedResponseTime: getEstimatedResponseTime(severity),
    nextSteps: getNextSteps(type, severity)
  });
}

/**
 * Calculate complaint severity based on content and metadata
 */
function calculateSeverity(subject: string, description: string, metadata: any): Complaint['severity'] {
  const text = `${subject} ${description}`.toLowerCase();

  // Critical keywords
  const criticalKeywords = [
    'scam', 'truffa', 'fraud', 'frode',
    'charged twice', 'doppio addebito',
    'unauthorized', 'non autorizzato',
    'stolen', 'rubato',
    'legal action', 'azione legale',
    'lawyer', 'avvocato'
  ];

  // High priority keywords
  const highKeywords = [
    'urgent', 'urgente',
    'immediately', 'immediatamente',
    'paid but', 'pagato ma',
    'not working', 'non funziona',
    'lost access', 'perso accesso',
    'just paid', 'appena pagato'
  ];

  // Check for critical patterns
  if (criticalKeywords.some(kw => text.includes(kw))) {
    return 'critical';
  }

  // Check for recent payment issues (paid within last 24 hours but having issues)
  if (metadata.paymentDate) {
    const paymentTime = new Date(metadata.paymentDate).getTime();
    const now = Date.now();
    const hoursSincePayment = (now - paymentTime) / (1000 * 60 * 60);
    
    if (hoursSincePayment < 24 && text.includes('usage')) {
      return 'high';
    }
  }

  // Check for high priority patterns
  if (highKeywords.some(kw => text.includes(kw))) {
    return 'high';
  }

  // Check usage percentage - if near limit despite new payment
  if (metadata.usagePercentage && metadata.usagePercentage > 80) {
    return 'high';
  }

  // Billing issues are generally medium priority
  if (text.includes('billing') || text.includes('fatturazione') || text.includes('payment')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get complaint by ID
 */
export async function getComplaint(params: any) {
  const { complaintId } = params || {};

  if (!complaintId) {
    throw new BadRequestError('Complaint ID is required');
  }

  const complaint = complaints.get(complaintId);

  if (!complaint) {
    throw new BadRequestError('Complaint not found');
  }

  return ok(complaint);
}

/**
 * Update complaint status
 */
export async function updateComplaintStatus(params: any) {
  const { complaintId, status, note, assignedTo } = params || {};

  if (!complaintId) {
    throw new BadRequestError('Complaint ID is required');
  }

  const complaint = complaints.get(complaintId);

  if (!complaint) {
    throw new BadRequestError('Complaint not found');
  }

  // Update complaint
  complaint.status = status || complaint.status;
  complaint.updatedAt = new Date().toISOString();

  if (assignedTo) {
    complaint.assignedTo = assignedTo;
  }

  if (note) {
    complaint.notes = complaint.notes || [];
    complaint.notes.push(`${new Date().toISOString()}: ${note}`);
  }

  if (status === 'resolved') {
    complaint.resolvedAt = new Date().toISOString();
  }

  complaints.set(complaintId, complaint);

  console.log(`📝 Complaint updated: ${complaintId} - Status: ${status}`);

  return ok({
    complaintId,
    status: complaint.status,
    updatedAt: complaint.updatedAt
  });
}

/**
 * List all complaints (with filters)
 */
export async function listComplaints(params: any) {
  const {
    type,
    severity,
    status,
    userId,
    limit = 50,
    offset = 0
  } = params || {};

  let filteredComplaints = Array.from(complaints.values());

  // Apply filters
  if (type) {
    filteredComplaints = filteredComplaints.filter(c => c.type === type);
  }

  if (severity) {
    filteredComplaints = filteredComplaints.filter(c => c.severity === severity);
  }

  if (status) {
    filteredComplaints = filteredComplaints.filter(c => c.status === status);
  }

  if (userId) {
    filteredComplaints = filteredComplaints.filter(c => c.userId === userId);
  }

  // Sort by severity (critical first) then by date (newest first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  filteredComplaints.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Pagination
  const total = filteredComplaints.length;
  const paginatedComplaints = filteredComplaints.slice(offset, offset + limit);

  return ok({
    complaints: paginatedComplaints,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

/**
 * Escalate complaint
 */
async function escalateComplaint(complaintId: string, reason: string) {
  const complaint = complaints.get(complaintId);
  if (!complaint) return;

  complaint.status = 'escalated';
  complaint.notes = complaint.notes || [];
  complaint.notes.push(`${new Date().toISOString()}: ESCALATED - ${reason}`);
  complaint.updatedAt = new Date().toISOString();

  complaints.set(complaintId, complaint);

  console.log(`⚠️ ESCALATED COMPLAINT: ${complaintId} - ${reason}`);
}

/**
 * Notify support team
 */
async function notifySupport(complaint: Complaint) {
  // In production, send email, Slack notification, etc.
  console.log(`🔔 SUPPORT NOTIFICATION: [${complaint.severity.toUpperCase()}] ${complaint.subject}`);
  console.log(`   Type: ${complaint.type}`);
  console.log(`   Complaint ID: ${complaint.id}`);
  console.log(`   Description: ${complaint.description.substring(0, 100)}...`);

  // TODO: Integrate with actual notification system
  // - Send email to support@balizero.com
  // - Post to Slack #support-urgent channel
  // - Create Jira ticket for critical issues
}

/**
 * Get response message based on severity
 */
function getResponseMessage(severity: Complaint['severity']): string {
  const messages = {
    critical: 'Your complaint has been marked as CRITICAL and escalated to our senior support team. You will receive a response within 1 hour.',
    high: 'Your complaint is HIGH PRIORITY. Our support team will contact you within 2-4 hours.',
    medium: 'Thank you for your feedback. Our support team will review your complaint and respond within 24 hours.',
    low: 'Your complaint has been received. We will review it and respond within 2-3 business days.'
  };

  return messages[severity];
}

/**
 * Get estimated response time
 */
function getEstimatedResponseTime(severity: Complaint['severity']): string {
  const times = {
    critical: '1 hour',
    high: '2-4 hours',
    medium: '24 hours',
    low: '2-3 business days'
  };

  return times[severity];
}

/**
 * Get next steps based on complaint type
 */
function getNextSteps(type: string, severity: string): string[] {
  const steps: { [key: string]: string[] } = {
    subscription: [
      'Our team will verify your subscription status',
      'We will review your payment history',
      'You will receive account access confirmation or refund if applicable'
    ],
    usage: [
      'We will audit your usage metrics',
      'Check for any system errors or miscalculations',
      'Provide detailed usage breakdown and resolution'
    ],
    billing: [
      'Verify payment transaction',
      'Review billing history',
      'Issue refund or credit if applicable'
    ],
    service: [
      'Technical team will investigate the issue',
      'Provide status updates',
      'Resolve or escalate to engineering'
    ],
    other: [
      'Support team will review your complaint',
      'Gather additional information if needed',
      'Provide resolution or escalate appropriately'
    ]
  };

  return steps[type] || steps.other;
}

/**
 * Get complaint statistics
 */
export async function getComplaintStats(params: any) {
  const { period = '7d' } = params || {};

  // Calculate period start date
  const now = Date.now();
  const periodMs = period === '24h' ? 24 * 60 * 60 * 1000 :
                   period === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                   30 * 24 * 60 * 60 * 1000;
  const periodStart = now - periodMs;

  // Filter complaints within period
  const periodComplaints = Array.from(complaints.values())
    .filter(c => new Date(c.createdAt).getTime() >= periodStart);

  // Calculate stats
  const stats = {
    total: periodComplaints.length,
    byType: {} as any,
    bySeverity: {} as any,
    byStatus: {} as any,
    averageResolutionTime: 0,
    escalationRate: 0
  };

  periodComplaints.forEach(c => {
    stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
    stats.bySeverity[c.severity] = (stats.bySeverity[c.severity] || 0) + 1;
    stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
  });

  // Calculate escalation rate
  const escalated = periodComplaints.filter(c => c.status === 'escalated').length;
  stats.escalationRate = periodComplaints.length > 0 
    ? (escalated / periodComplaints.length) * 100 
    : 0;

  // Calculate average resolution time (for resolved complaints)
  const resolved = periodComplaints.filter(c => c.resolvedAt);
  if (resolved.length > 0) {
    const totalResolutionTime = resolved.reduce((sum, c) => {
      const created = new Date(c.createdAt).getTime();
      const resolvedTime = new Date(c.resolvedAt!).getTime();
      return sum + (resolvedTime - created);
    }, 0);
    stats.averageResolutionTime = totalResolutionTime / resolved.length;
  }

  return ok(stats);
}
