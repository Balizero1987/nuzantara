/**
 * Tests for Team Management Handler
 * Tests Bali Zero team data retrieval and filtering
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { teamList, teamGet, teamDepartments } from '../team.js';
import { createMockRequest, createMockResponse } from '../../../tests/helpers/mocks.js';

describe('Team Handler', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
  });

  describe('teamList', () => {
    it('should return all team members when no filters applied', async () => {
      mockReq.body.params = {};
      await teamList(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            members: expect.any(Array),
            departments: expect.any(Object),
            stats: expect.any(Object),
            count: 23,
            total: 23,
          }),
        })
      );
    });

    it('should filter members by department', async () => {
      mockReq.body.params = { department: 'setup' };
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.members.length).toBe(10);
      response.data.members.forEach((member: any) => {
        expect(member.department).toBe('setup');
      });
    });

    it('should filter members by role', async () => {
      mockReq.body.params = { role: 'Lead Executive' };
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      response.data.members.forEach((member: any) => {
        expect(member.role).toContain('Lead Executive');
      });
    });

    it('should search members by name', async () => {
      mockReq.body.params = { search: 'Amanda' };
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.members.length).toBeGreaterThan(0);
      expect(response.data.members[0].name).toBe('Amanda');
    });

    it('should search members by email', async () => {
      mockReq.body.params = { search: 'zainal@balizero.com' };
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.members.length).toBe(1);
      expect(response.data.members[0].email).toBe('zainal@balizero.com');
    });

    it('should return tax department members', async () => {
      mockReq.body.params = { department: 'tax' };
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.members.length).toBe(5);
      response.data.members.forEach((member: any) => {
        expect(member.department).toBe('tax');
      });
    });

    it('should include department metadata', async () => {
      mockReq.body.params = {};
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.departments).toHaveProperty('setup');
      expect(response.data.departments.setup).toHaveProperty('name');
      expect(response.data.departments.setup).toHaveProperty('color');
      expect(response.data.departments.setup).toHaveProperty('icon');
    });

    it('should include team statistics', async () => {
      mockReq.body.params = {};
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.stats).toHaveProperty('total', 23);
      expect(response.data.stats).toHaveProperty('byDepartment');
      expect(response.data.stats).toHaveProperty('byLanguage');
    });

    it('should handle case-insensitive search', async () => {
      mockReq.body.params = { search: 'AMANDA' };
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.members.length).toBeGreaterThan(0);
    });

    it('should return management team', async () => {
      mockReq.body.params = { department: 'management' };
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.members.length).toBe(2);
      const names = response.data.members.map((m: any) => m.name);
      expect(names).toContain('Zainal Abidin');
      expect(names).toContain('Ruslana');
    });

    it('should handle errors gracefully', async () => {
      mockReq.body.params = null;
      await teamList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.any(String),
        })
      );
    });
  });

  describe('teamGet', () => {
    it('should get specific member by id', async () => {
      mockReq.body.params = { id: 'zainal' };
      await teamGet(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            member: expect.objectContaining({
              id: 'zainal',
              name: 'Zainal Abidin',
              role: 'CEO',
              department: 'management',
            }),
            department: expect.any(Object),
          }),
        })
      );
    });

    it('should get member by email', async () => {
      mockReq.body.params = { email: 'amanda@balizero.com' };
      await teamGet(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.member.name).toBe('Amanda');
      expect(response.data.member.email).toBe('amanda@balizero.com');
    });

    it('should return department info with member', async () => {
      mockReq.body.params = { id: 'amanda' };
      await teamGet(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.department).toHaveProperty('name');
      expect(response.data.department.name).toBe('Setup & Operations');
    });

    it('should return 400 if neither id nor email provided', async () => {
      mockReq.body.params = {};
      await teamGet(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.stringContaining('id or email parameter is required'),
        })
      );
    });

    it('should return 404 if member not found', async () => {
      mockReq.body.params = { id: 'non-existent-id' };
      await teamGet(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: 'Team member not found',
        })
      );
    });

    it('should handle case-insensitive email lookup', async () => {
      mockReq.body.params = { email: 'ZAINAL@BALIZERO.COM' };
      await teamGet(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.member.name).toBe('Zainal Abidin');
    });

    it('should include member badge and language', async () => {
      mockReq.body.params = { id: 'zero' };
      await teamGet(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.member).toHaveProperty('badge');
      expect(response.data.member).toHaveProperty('language', 'Italian');
    });
  });

  describe('teamDepartments', () => {
    it('should return all departments when no name specified', async () => {
      mockReq.body.params = {};
      await teamDepartments(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            departments: expect.any(Object),
            stats: expect.any(Object),
            total: 7,
          }),
        })
      );
    });

    it('should return specific department with members', async () => {
      mockReq.body.params = { name: 'setup' };
      await teamDepartments(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.department).toHaveProperty('id', 'setup');
      expect(response.data.department).toHaveProperty('name', 'Setup & Operations');
      expect(response.data.members).toHaveLength(10);
      expect(response.data.count).toBe(10);
    });

    it('should return tax department', async () => {
      mockReq.body.params = { name: 'tax' };
      await teamDepartments(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.department.name).toBe('Tax Department');
      expect(response.data.members).toHaveLength(5);
    });

    it('should return 404 for non-existent department', async () => {
      mockReq.body.params = { name: 'non-existent-dept' };
      await teamDepartments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: 'Department not found',
        })
      );
    });

    it('should include department statistics in all departments view', async () => {
      mockReq.body.params = {};
      await teamDepartments(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data.stats).toHaveProperty('management', 2);
      expect(response.data.stats).toHaveProperty('setup', 10);
      expect(response.data.stats).toHaveProperty('tax', 5);
    });

    it('should return technology department with single member', async () => {
      mockReq.body.params = { name: 'technology' };
      await teamDepartments(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.ok).toBe(true);
      expect(response.data.members).toHaveLength(1);
      expect(response.data.members[0].name).toBe('Zero');
    });

    it('should handle errors gracefully', async () => {
      mockReq.body.params = null;
      await teamDepartments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Team Data Integrity', () => {
    it('should have complete member data structure', async () => {
      mockReq.body.params = { id: 'amanda' };
      await teamGet(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const member = response.data.member;

      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('department');
      expect(member).toHaveProperty('badge');
      expect(member).toHaveProperty('language');
    });

    it('should have valid email format for all members', async () => {
      mockReq.body.params = {};
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      response.data.members.forEach((member: any) => {
        expect(member.email).toMatch(/@balizero\.com$/);
      });
    });

    it('should count total members correctly', async () => {
      mockReq.body.params = {};
      await teamList(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const departmentTotal = Object.values(response.data.stats.byDepartment).reduce(
        (acc: number, val: any) => acc + val,
        0
      );
      expect(departmentTotal).toBe(23);
    });
  });
});
