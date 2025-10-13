/**
 * Complaint Handler Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  submitComplaint,
  getComplaint,
  updateComplaintStatus,
  listComplaints,
  getComplaintStats
} from '../complaint-handler';

describe('Complaint Handler', () => {
  describe('submitComplaint', () => {
    it('should successfully submit a complaint', async () => {
      const params = {
        userId: 'user123',
        type: 'subscription',
        subject: 'Usage warning after payment',
        description: 'I paid $60 2 hours ago for PRO+ but received usage warning',
        metadata: {
          subscriptionPlan: 'PRO+',
          paymentAmount: 60,
          paymentDate: new Date().toISOString(),
          usagePercentage: 95
        }
      };

      const result = await submitComplaint(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('complaintId');
      expect(result.data).toHaveProperty('severity');
      expect(result.data).toHaveProperty('status', 'submitted');
      expect(result.data).toHaveProperty('estimatedResponseTime');
      expect(result.data).toHaveProperty('nextSteps');
    });

    it('should classify as critical for scam-related complaints', async () => {
      const params = {
        type: 'billing',
        subject: 'This is a scam',
        description: 'Charged me twice for the same service, this is fraud!',
        metadata: {
          paymentAmount: 120
        }
      };

      const result = await submitComplaint(params);

      expect(result.ok).toBe(true);
      expect(result.data.severity).toBe('critical');
    });

    it('should classify as high priority for recent payment issues', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const params = {
        type: 'usage',
        subject: 'Usage limit reached after payment',
        description: 'Just paid for PRO+ but still getting usage warnings',
        metadata: {
          subscriptionPlan: 'PRO+',
          paymentDate: twoHoursAgo,
          paymentAmount: 60
        }
      };

      const result = await submitComplaint(params);

      expect(result.ok).toBe(true);
      expect(result.data.severity).toBe('high');
    });

    it('should reject complaint without required fields', async () => {
      const params = {
        type: 'subscription'
        // Missing subject and description
      };

      await expect(submitComplaint(params)).rejects.toThrow('Subject and description are required');
    });

    it('should reject invalid complaint type', async () => {
      const params = {
        type: 'invalid_type',
        subject: 'Test',
        description: 'Test description'
      };

      await expect(submitComplaint(params)).rejects.toThrow('Invalid complaint type');
    });
  });

  describe('getComplaint', () => {
    it('should retrieve an existing complaint', async () => {
      // First submit a complaint
      const submitParams = {
        type: 'service',
        subject: 'Feature not working',
        description: 'The export function is broken'
      };

      const submitted = await submitComplaint(submitParams);
      const complaintId = submitted.data.complaintId;

      // Then retrieve it
      const result = await getComplaint({ complaintId });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('id', complaintId);
      expect(result.data).toHaveProperty('subject', 'Feature not working');
      expect(result.data).toHaveProperty('status', 'new');
    });

    it('should throw error for non-existent complaint', async () => {
      await expect(getComplaint({ complaintId: 'non-existent-id' }))
        .rejects.toThrow('Complaint not found');
    });

    it('should throw error when complaintId is missing', async () => {
      await expect(getComplaint({}))
        .rejects.toThrow('Complaint ID is required');
    });
  });

  describe('updateComplaintStatus', () => {
    it('should successfully update complaint status', async () => {
      // Submit a complaint first
      const submitParams = {
        type: 'billing',
        subject: 'Incorrect charge',
        description: 'Charged wrong amount'
      };

      const submitted = await submitComplaint(submitParams);
      const complaintId = submitted.data.complaintId;

      // Update status
      const updateResult = await updateComplaintStatus({
        complaintId,
        status: 'investigating',
        note: 'Team is reviewing the billing records',
        assignedTo: 'support-team@balizero.com'
      });

      expect(updateResult.ok).toBe(true);
      expect(updateResult.data).toHaveProperty('status', 'investigating');

      // Verify the update
      const retrieved = await getComplaint({ complaintId });
      expect(retrieved.data.status).toBe('investigating');
      expect(retrieved.data.assignedTo).toBe('support-team@balizero.com');
      expect(retrieved.data.notes).toHaveLength(1);
    });

    it('should set resolvedAt when status is resolved', async () => {
      const submitParams = {
        type: 'service',
        subject: 'Bug report',
        description: 'Found a bug'
      };

      const submitted = await submitComplaint(submitParams);
      const complaintId = submitted.data.complaintId;

      await updateComplaintStatus({
        complaintId,
        status: 'resolved',
        note: 'Bug fixed in version 2.0'
      });

      const retrieved = await getComplaint({ complaintId });
      expect(retrieved.data.status).toBe('resolved');
      expect(retrieved.data.resolvedAt).toBeDefined();
    });
  });

  describe('listComplaints', () => {
    beforeEach(async () => {
      // Submit several test complaints
      await submitComplaint({
        type: 'subscription',
        subject: 'Critical subscription issue',
        description: 'This is a scam! Charged twice!',
        userId: 'user1'
      });

      await submitComplaint({
        type: 'usage',
        subject: 'Usage limit issue',
        description: 'Usage warnings after payment',
        userId: 'user1'
      });

      await submitComplaint({
        type: 'service',
        subject: 'Feature request',
        description: 'Would like dark mode',
        userId: 'user2'
      });
    });

    it('should list all complaints', async () => {
      const result = await listComplaints({});

      expect(result.ok).toBe(true);
      expect(result.data.complaints.length).toBeGreaterThan(0);
      expect(result.data.pagination).toHaveProperty('total');
      expect(result.data.pagination).toHaveProperty('hasMore');
    });

    it('should filter complaints by type', async () => {
      const result = await listComplaints({ type: 'subscription' });

      expect(result.ok).toBe(true);
      result.data.complaints.forEach((c: any) => {
        expect(c.type).toBe('subscription');
      });
    });

    it('should filter complaints by severity', async () => {
      const result = await listComplaints({ severity: 'critical' });

      expect(result.ok).toBe(true);
      result.data.complaints.forEach((c: any) => {
        expect(c.severity).toBe('critical');
      });
    });

    it('should filter complaints by userId', async () => {
      const result = await listComplaints({ userId: 'user1' });

      expect(result.ok).toBe(true);
      result.data.complaints.forEach((c: any) => {
        expect(c.userId).toBe('user1');
      });
    });

    it('should sort by severity (critical first)', async () => {
      const result = await listComplaints({});

      expect(result.ok).toBe(true);
      const severities = result.data.complaints.map((c: any) => c.severity);
      
      // Verify critical complaints come first
      const firstCriticalIndex = severities.indexOf('critical');
      const firstLowIndex = severities.indexOf('low');
      
      if (firstCriticalIndex !== -1 && firstLowIndex !== -1) {
        expect(firstCriticalIndex).toBeLessThan(firstLowIndex);
      }
    });

    it('should paginate results', async () => {
      const result1 = await listComplaints({ limit: 2, offset: 0 });
      const result2 = await listComplaints({ limit: 2, offset: 2 });

      expect(result1.data.complaints.length).toBeLessThanOrEqual(2);
      expect(result2.data.complaints.length).toBeLessThanOrEqual(2);
      
      // Results should be different
      if (result1.data.complaints.length > 0 && result2.data.complaints.length > 0) {
        expect(result1.data.complaints[0].id).not.toBe(result2.data.complaints[0].id);
      }
    });
  });

  describe('getComplaintStats', () => {
    beforeEach(async () => {
      // Submit test complaints with different characteristics
      await submitComplaint({
        type: 'subscription',
        subject: 'Critical issue',
        description: 'This is a scam!',
      });

      await submitComplaint({
        type: 'billing',
        subject: 'Payment problem',
        description: 'Double charged',
      });

      await submitComplaint({
        type: 'service',
        subject: 'Feature not working',
        description: 'Bug in export',
      });

      // Resolve one complaint
      const resolved = await submitComplaint({
        type: 'usage',
        subject: 'Usage question',
        description: 'How do I check usage?',
      });

      await updateComplaintStatus({
        complaintId: resolved.data.complaintId,
        status: 'resolved'
      });
    });

    it('should return complaint statistics', async () => {
      const result = await getComplaintStats({ period: '7d' });

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('total');
      expect(result.data).toHaveProperty('byType');
      expect(result.data).toHaveProperty('bySeverity');
      expect(result.data).toHaveProperty('byStatus');
      expect(result.data).toHaveProperty('averageResolutionTime');
      expect(result.data).toHaveProperty('escalationRate');
    });

    it('should calculate statistics by type', async () => {
      const result = await getComplaintStats({ period: '7d' });

      expect(result.ok).toBe(true);
      expect(result.data.byType).toHaveProperty('subscription');
      expect(result.data.byType).toHaveProperty('billing');
      expect(result.data.byType).toHaveProperty('service');
    });

    it('should calculate statistics by severity', async () => {
      const result = await getComplaintStats({ period: '7d' });

      expect(result.ok).toBe(true);
      expect(result.data.bySeverity).toHaveProperty('critical');
    });

    it('should support different time periods', async () => {
      const result24h = await getComplaintStats({ period: '24h' });
      const result7d = await getComplaintStats({ period: '7d' });
      const result30d = await getComplaintStats({ period: '30d' });

      expect(result24h.ok).toBe(true);
      expect(result7d.ok).toBe(true);
      expect(result30d.ok).toBe(true);

      // 30d should have equal or more complaints than 7d
      expect(result30d.data.total).toBeGreaterThanOrEqual(result7d.data.total);
    });
  });

  describe('Real-world scenario: Subscription usage complaint', () => {
    it('should handle the exact scenario from the user complaint', async () => {
      // Simula il reclamo reale dell'utente
      const params = {
        userId: 'user_antonio',
        type: 'subscription',
        subject: 'Usage warning immediately after PRO+ payment',
        description: 'Ho pagato 60 dollari 2 ore fa per PRO+ e tu mi mandi un messaggio che sto per finire lo usage. Questa è una truffa!',
        metadata: {
          subscriptionPlan: 'PRO+',
          paymentAmount: 60,
          paymentDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          usagePercentage: 95,
          expectedBehavior: 'Should have full quota reset after payment',
          actualBehavior: 'Received usage warning 2 hours after payment'
        }
      };

      const result = await submitComplaint(params);

      // Verify proper handling
      expect(result.ok).toBe(true);
      expect(result.data.severity).toBe('critical'); // Should be critical due to "truffa" (scam) keyword
      expect(result.data.status).toBe('submitted');
      expect(result.data.estimatedResponseTime).toBe('1 hour');
      expect(result.data.message).toContain('CRITICAL');
      expect(result.data.nextSteps).toContain('We will verify your subscription status');
      expect(result.data.nextSteps).toContain('We will review your payment history');

      // Verify the complaint was stored correctly
      const retrieved = await getComplaint({ complaintId: result.data.complaintId });
      expect(retrieved.data.status).toBe('escalated'); // Should be auto-escalated
      expect(retrieved.data.type).toBe('subscription');
      expect(retrieved.data.severity).toBe('critical');
    });
  });
});
