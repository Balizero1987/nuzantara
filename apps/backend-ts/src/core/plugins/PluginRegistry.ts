/**
 * Plugin Registry
 *
 * Central registry for all plugins. Handles loading, discovery, versioning, and lifecycle.
 */

import { Plugin, PluginMetadata, PluginCategory } from './Plugin';

export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private metadata: Map<string, PluginMetadata> = new Map();
  private versions: Map<string, string[]> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    console.log('✅ PluginRegistry initialized');
  }

  /**
   * Register a plugin instance
   *
   * @param plugin - Plugin instance to register
   */
  async register(plugin: Plugin): Promise<void> {
    const metadata = plugin.metadata;

    // Check for conflicts
    if (this.plugins.has(metadata.name)) {
      const existing = this.metadata.get(metadata.name);
      if (existing && existing.version === metadata.version) {
        console.warn(
          `Plugin ${metadata.name} v${metadata.version} already registered, skipping`
        );
        return;
      }
    }

    // Register
    this.plugins.set(metadata.name, plugin);
    this.metadata.set(metadata.name, metadata);

    // Track versions
    const versions = this.versions.get(metadata.name) || [];
    if (!versions.includes(metadata.version)) {
      versions.push(metadata.version);
      this.versions.set(metadata.name, versions);
    }

    // Register legacy handler key as alias
    if (metadata.legacyHandlerKey) {
      this.aliases.set(metadata.legacyHandlerKey, metadata.name);
    }

    // Call lifecycle hook
    try {
      await plugin.onLoad();
      console.log(
        `✅ Registered plugin: ${metadata.name} v${metadata.version} (${metadata.category})`
      );
    } catch (error: any) {
      console.error(`❌ Failed to load plugin ${metadata.name}:`, error);
      // Rollback registration
      this.plugins.delete(metadata.name);
      this.metadata.delete(metadata.name);
      throw error;
    }
  }

  /**
   * Register multiple plugins in batch
   *
   * @param plugins - Array of plugin instances
   */
  async registerBatch(plugins: Plugin[]): Promise<void> {
    for (const plugin of plugins) {
      try {
        await this.register(plugin);
      } catch (error: any) {
        console.error(`Failed to register plugin:`, error);
      }
    }
  }

  /**
   * Unregister a plugin
   *
   * @param name - Plugin name to unregister
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      try {
        await plugin.onUnload();
        console.log(`Unloaded plugin: ${name}`);
      } catch (error: any) {
        console.error(`Error unloading plugin ${name}:`, error);
      }

      this.plugins.delete(name);
      this.metadata.delete(name);

      // Remove aliases
      for (const [alias, canonical] of this.aliases.entries()) {
        if (canonical === name) {
          this.aliases.delete(alias);
        }
      }

      console.log(`Unregistered plugin: ${name}`);
    }
  }

  /**
   * Get plugin by name or alias
   *
   * @param name - Plugin name or legacy handler key
   * @returns Plugin instance or undefined
   */
  get(name: string): Plugin | undefined {
    // Try direct lookup
    if (this.plugins.has(name)) {
      return this.plugins.get(name);
    }

    // Try alias lookup
    const canonicalName = this.aliases.get(name);
    if (canonicalName) {
      return this.plugins.get(canonicalName);
    }

    return undefined;
  }

  /**
   * Get plugin metadata by name
   *
   * @param name - Plugin name
   * @returns Plugin metadata or undefined
   */
  getMetadata(name: string): PluginMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * List all plugins, optionally filtered
   *
   * @param filters - Optional filters
   * @returns Array of plugin metadata
   */
  listPlugins(filters?: {
    category?: PluginCategory;
    tags?: string[];
    allowedModels?: string[];
  }): PluginMetadata[] {
    let result = Array.from(this.metadata.values());

    if (filters) {
      if (filters.category) {
        result = result.filter((m) => m.category === filters.category);
      }

      if (filters.tags) {
        result = result.filter((m) =>
          filters.tags!.some((tag) => m.tags.includes(tag))
        );
      }

      if (filters.allowedModels) {
        result = result.filter((m) =>
          filters.allowedModels!.some((model) => m.allowedModels.includes(model))
        );
      }
    }

    // Sort by category, then name
    result.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }

  /**
   * Search plugins by name, description, or tags
   *
   * @param query - Search query string
   * @returns Array of matching plugin metadata
   */
  search(query: string): PluginMetadata[] {
    const lowerQuery = query.toLowerCase();
    const results: PluginMetadata[] = [];

    for (const metadata of this.metadata.values()) {
      if (
        metadata.name.toLowerCase().includes(lowerQuery) ||
        metadata.description.toLowerCase().includes(lowerQuery) ||
        metadata.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push(metadata);
      }
    }

    return results;
  }

  /**
   * Get registry statistics
   *
   * @returns Statistics object
   */
  getStatistics(): any {
    const categoryCount: Record<string, number> = {};

    for (const metadata of this.metadata.values()) {
      categoryCount[metadata.category] = (categoryCount[metadata.category] || 0) + 1;
    }

    return {
      totalPlugins: this.plugins.size,
      categories: Object.keys(categoryCount).length,
      categoryCount,
      totalVersions: Array.from(this.versions.values()).reduce(
        (sum, versions) => sum + versions.length,
        0
      ),
      aliases: this.aliases.size
    };
  }

  /**
   * Get all plugins as Anthropic tool definitions
   *
   * @returns Array of tool definitions
   */
  getAllAnthropicTools(): any[] {
    const tools: any[] = [];

    for (const plugin of this.plugins.values()) {
      try {
        const toolDef = plugin.toAnthropicToolDefinition();
        tools.push(toolDef);
      } catch (error: any) {
        console.error(
          `Failed to generate Anthropic tool definition for ${plugin.metadata.name}:`,
          error
        );
      }
    }

    return tools;
  }

  /**
   * Get tools allowed for Haiku model (fast, limited set)
   *
   * @returns Array of tool definitions for Haiku
   */
  getHaikuAllowedTools(): any[] {
    const tools: any[] = [];

    for (const plugin of this.plugins.values()) {
      if (plugin.metadata.allowedModels.includes('haiku')) {
        try {
          const toolDef = plugin.toAnthropicToolDefinition();
          tools.push(toolDef);
        } catch (error: any) {
          console.error(`Failed to generate tool definition:`, error);
        }
      }
    }

    return tools;
  }

  /**
   * Hot-reload a plugin (admin only)
   *
   * @param name - Plugin name to reload
   */
  async reloadPlugin(name: string): Promise<void> {
    const plugin = this.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    // Unload and reload
    await this.unregister(name);
    await this.register(plugin);

    console.log(`Reloaded plugin: ${name}`);
  }

  /**
   * Get all plugin names
   */
  getAllPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if plugin exists
   */
  has(name: string): boolean {
    return this.plugins.has(name) || this.aliases.has(name);
  }
}

// Global registry instance
export const registry = new PluginRegistry();
