/**
 * ZANTARA Unified Plugin Architecture - TypeScript
 *
 * Export all plugin infrastructure
 */

export {
  Plugin,
  PluginCategory,
  PluginMetadata,
  PluginOutput,
  PluginContext,
  createSimplePlugin,
  wrapHandlerAsPlugin
} from './Plugin';

export { PluginRegistry, registry } from './PluginRegistry';
export { PluginExecutor, executor } from './PluginExecutor';
