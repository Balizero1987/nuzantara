/**
 * Test coverage for components/index.ts (barrel export)
 * Target: 100% coverage
 */

import {
  ChatHeader,
  ChatSidebar,
  ChatMessages,
  ChatInput,
  ImageGenerationModal,
  WelcomeScreen,
} from '../index';

describe('components/index.ts', () => {
  it('should export ChatHeader', () => {
    expect(ChatHeader).toBeDefined();
  });

  it('should export ChatSidebar', () => {
    expect(ChatSidebar).toBeDefined();
  });

  it('should export ChatMessages', () => {
    expect(ChatMessages).toBeDefined();
  });

  it('should export ChatInput', () => {
    expect(ChatInput).toBeDefined();
  });

  it('should export ImageGenerationModal', () => {
    expect(ImageGenerationModal).toBeDefined();
  });

  it('should export WelcomeScreen', () => {
    expect(WelcomeScreen).toBeDefined();
  });
});

