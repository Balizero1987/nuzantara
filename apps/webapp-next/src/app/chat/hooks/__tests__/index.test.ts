/**
 * Test coverage for hooks/index.ts (barrel export)
 * Target: 100% coverage
 */

import { useChatSession, useImageGeneration } from '../index';

describe('hooks/index.ts', () => {
  it('should export useChatSession', () => {
    expect(useChatSession).toBeDefined();
    expect(typeof useChatSession).toBe('function');
  });

  it('should export useImageGeneration', () => {
    expect(useImageGeneration).toBeDefined();
    expect(typeof useImageGeneration).toBe('function');
  });
});

