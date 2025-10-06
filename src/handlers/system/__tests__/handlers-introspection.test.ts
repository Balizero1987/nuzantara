/**
 * System Handlers Test Suite
 * Tests the tool use integration handlers
 */

import { getAllHandlers, getHandlersByCategory, getAnthropicToolDefinitions } from '../handlers-introspection.js';

describe('System Handlers', () => {
  describe('getAllHandlers', () => {
    it('should return handler list with metadata', async () => {
      const result = await getAllHandlers({});

      expect(result.ok).toBe(true);
      expect(result.data?.handlers).toBeDefined();
      expect(Array.isArray(result.data?.handlers)).toBe(true);
      expect(result.data?.total).toBeGreaterThan(0);
      expect(result.data?.categories).toBeDefined();
    });

    it('should include handler counts by category', async () => {
      const result = await getAllHandlers({});

      expect(result.data?.categories).toBeDefined();
      expect(typeof result.data?.categories).toBe('object');
      
      // Check for expected categories
      const categories = result.data?.categories as Record<string, number>;
      expect(categories['Google Workspace']).toBeGreaterThan(0);
      expect(categories['Memory']).toBeGreaterThan(0);
      expect(categories['AI Services']).toBeGreaterThan(0);
    });
  });

  describe('getHandlersByCategory', () => {
    it('should filter handlers by category', async () => {
      const params = { category: 'Memory' };
      const result = await getHandlersByCategory(params);

      expect(result.ok).toBe(true);
      expect(result.data?.category).toBe('Memory');
      expect(result.data?.handlers).toBeDefined();
      expect(Array.isArray(result.data?.handlers)).toBe(true);
    });

    it('should return empty for invalid category', async () => {
      const params = { category: 'NonExistentCategory' };
      const result = await getHandlersByCategory(params);

      expect(result.ok).toBe(true);
      expect(result.data?.handlers).toHaveLength(0);
    });

    it('should require category parameter', async () => {
      const params = {};
      const result = await getHandlersByCategory(params);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('category');
    });
  });

  describe('getAnthropicToolDefinitions', () => {
    it('should return Anthropic-compatible tool definitions', async () => {
      const result = await getAnthropicToolDefinitions({});

      expect(result.ok).toBe(true);
      expect(result.data?.tools).toBeDefined();
      expect(Array.isArray(result.data?.tools)).toBe(true);
      expect(result.data?.count).toBeGreaterThan(0);
    });

    it('should have valid tool structure', async () => {
      const result = await getAnthropicToolDefinitions({});
      const tools = result.data?.tools as any[];

      expect(tools.length).toBeGreaterThan(0);
      
      // Check first tool has required structure
      const firstTool = tools[0];
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
      expect(firstTool).toHaveProperty('input_schema');
      expect(firstTool.input_schema).toHaveProperty('type', 'object');
      expect(firstTool.input_schema).toHaveProperty('properties');
    });

    it('should include core handlers as tools', async () => {
      const result = await getAnthropicToolDefinitions({});
      const tools = result.data?.tools as any[];
      
      const toolNames = tools.map(t => t.name);
      
      // Check for essential tools
      expect(toolNames).toContain('memory_save');
      expect(toolNames).toContain('gmail_send');
      expect(toolNames).toContain('drive_upload');
    });
  });
});