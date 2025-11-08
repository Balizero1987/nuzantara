/**
 * ZANTARA Unified Plugin Architecture - TypeScript Implementation
 *
 * Base plugin interface matching Python implementation.
 * Provides standardized interface for all TypeScript handlers.
 */

import { z } from 'zod';

/**
 * Plugin categories matching existing handler structure
 */
export enum PluginCategory {
  AI_SERVICES = 'ai-services',
  ANALYTICS = 'analytics',
  AUTH = 'auth',
  BALI_ZERO = 'bali-zero',
  COMMUNICATION = 'communication',
  GOOGLE_WORKSPACE = 'google-workspace',
  IDENTITY = 'identity',
  INTEL = 'intel',
  MAPS = 'maps',
  MEMORY = 'memory',
  RAG = 'rag',
  SYSTEM = 'system',
  ZANTARA = 'zantara',
  ZERO = 'zero',
  // Additional categories
  IMMIGRATION = 'immigration',
  TAX = 'tax',
  BUSINESS = 'business',
  PROPERTY = 'property',
  LEGAL = 'legal',
  FINANCE = 'finance',
  GENERAL = 'general'
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Unique plugin name (e.g., 'gmail.send') */
  name: string;
  /** Semantic version (e.g., '1.0.0') */
  version: string;
  /** Description of what this plugin does */
  description: string;
  /** Plugin category */
  category: PluginCategory;
  /** Plugin author */
  author?: string;
  /** Searchable tags */
  tags: string[];
  /** Requires user authentication */
  requiresAuth: boolean;
  /** Admin only */
  requiresAdmin: boolean;
  /** Other plugins needed */
  dependencies?: string[];
  /** Estimated execution time (seconds) */
  estimatedTime: number;
  /** Max calls per minute */
  rateLimit?: number;
  /** Which AI models can use this plugin */
  allowedModels: string[];
  /** Original handler key for backward compatibility */
  legacyHandlerKey?: string;
}

/**
 * Plugin output
 */
export interface PluginOutput<T = any> {
  /** Whether execution succeeded */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Execution metadata */
  metadata?: Record<string, any>;
  /** Legacy success field for backward compatibility */
  ok?: boolean;
}

/**
 * Plugin execution context
 */
export interface PluginContext {
  /** User ID (if authenticated) */
  userId?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Custom context data */
  [key: string]: any;
}

/**
 * Base Plugin class
 *
 * All ZANTARA plugins should extend this class or implement its interface.
 *
 * Example:
 * ```typescript
 * const EmailInputSchema = z.object({
 *   to: z.string().email(),
 *   subject: z.string(),
 *   body: z.string()
 * });
 *
 * class EmailSenderPlugin extends Plugin<z.infer<typeof EmailInputSchema>, EmailResult> {
 *   metadata: PluginMetadata = {
 *     name: 'gmail.send',
 *     version: '1.0.0',
 *     description: 'Send email via Gmail',
 *     category: PluginCategory.GOOGLE_WORKSPACE,
 *     tags: ['email', 'gmail', 'send'],
 *     requiresAuth: true,
 *     requiresAdmin: false,
 *     estimatedTime: 2.0,
 *     rateLimit: 10,
 *     allowedModels: ['haiku', 'sonnet', 'opus']
 *   };
 *
 *   inputSchema = EmailInputSchema;
 *
 *   async execute(input: EmailInput, context: PluginContext): Promise<PluginOutput<EmailResult>> {
 *     // Implementation
 *     return { success: true, data: result };
 *   }
 * }
 * ```
 */
export abstract class Plugin<TInput = any, TOutput = any> {
  /** Plugin metadata */
  abstract metadata: PluginMetadata;

  /** Zod schema for input validation */
  abstract inputSchema: z.ZodSchema<TInput>;

  /** Optional configuration */
  protected config: Record<string, any> = {};

  constructor(config?: Record<string, any>) {
    this.config = config || {};
  }

  /**
   * Main execution logic. Must be async.
   *
   * @param input - Validated input data
   * @param context - Execution context
   * @returns Plugin output with results
   */
  abstract execute(
    input: TInput,
    context?: PluginContext
  ): Promise<PluginOutput<TOutput>>;

  /**
   * Optional validation logic beyond Zod.
   * Override if needed for complex validation.
   *
   * @param input - Input data to validate
   * @returns True if valid, false otherwise
   */
  async validate(input: TInput): Promise<boolean> {
    return true;
  }

  /**
   * Validate input against schema
   *
   * @param rawInput - Raw input data
   * @returns Validated input or error
   */
  validateInput(rawInput: any): { success: true; data: TInput } | { success: false; error: string } {
    try {
      const validated = this.inputSchema.parse(rawInput);
      return { success: true, data: validated };
    } catch (error: any) {
      return {
        success: false,
        error: `Input validation failed: ${error.message}`
      };
    }
  }

  /**
   * Called when plugin is loaded. Override for setup.
   */
  async onLoad(): Promise<void> {
    // Override in subclass
  }

  /**
   * Called when plugin is unloaded. Override for cleanup.
   */
  async onUnload(): Promise<void> {
    // Override in subclass
  }

  /**
   * Convert plugin to Anthropic tool definition format
   */
  toAnthropicToolDefinition(): any {
    // Convert Zod schema to JSON schema
    const inputSchemaJson = this.zodToJsonSchema(this.inputSchema);

    return {
      name: this.metadata.name.replace(/\./g, '_'),
      description: this.metadata.description,
      input_schema: inputSchemaJson
    };
  }

  /**
   * Convert plugin to legacy handler format for backward compatibility
   */
  toHandlerFormat(): any {
    return {
      key: this.metadata.legacyHandlerKey || this.metadata.name,
      description: this.metadata.description,
      requiresAuth: this.metadata.requiresAuth,
      requiresAdmin: this.metadata.requiresAdmin,
      tags: this.metadata.tags
    };
  }

  /**
   * Convert Zod schema to JSON schema (simplified)
   * For full implementation, use zod-to-json-schema library
   */
  private zodToJsonSchema(schema: z.ZodSchema): any {
    // This is a simplified implementation
    // In production, use the 'zod-to-json-schema' library
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }
}

/**
 * Helper to create a plugin from a simple handler function
 *
 * @param metadata - Plugin metadata
 * @param inputSchema - Zod input schema
 * @param handler - Handler function
 * @returns Plugin instance
 */
export function createSimplePlugin<TInput, TOutput>(
  metadata: PluginMetadata,
  inputSchema: z.ZodSchema<TInput>,
  handler: (input: TInput, context?: PluginContext) => Promise<PluginOutput<TOutput>>
): Plugin<TInput, TOutput> {
  return new (class extends Plugin<TInput, TOutput> {
    metadata = metadata;
    inputSchema = inputSchema;
    async execute(input: TInput, context?: PluginContext): Promise<PluginOutput<TOutput>> {
      return handler(input, context);
    }
  })();
}

/**
 * Helper to wrap existing handler functions as plugins
 *
 * @param name - Plugin name
 * @param category - Plugin category
 * @param description - Description
 * @param handler - Existing handler function
 * @param options - Additional options
 * @returns Plugin instance
 */
export function wrapHandlerAsPlugin(
  name: string,
  category: PluginCategory,
  description: string,
  handler: (params: any) => Promise<any>,
  options: {
    inputSchema?: z.ZodSchema;
    tags?: string[];
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    estimatedTime?: number;
    rateLimit?: number;
    legacyHandlerKey?: string;
  } = {}
): Plugin {
  const metadata: PluginMetadata = {
    name,
    version: '1.0.0',
    description,
    category,
    tags: options.tags || [],
    requiresAuth: options.requiresAuth || false,
    requiresAdmin: options.requiresAdmin || false,
    estimatedTime: options.estimatedTime || 1.0,
    rateLimit: options.rateLimit,
    allowedModels: ['haiku', 'sonnet', 'opus'],
    legacyHandlerKey: options.legacyHandlerKey || name
  };

  const inputSchema = options.inputSchema || z.any();

  return createSimplePlugin(metadata, inputSchema, async (input, context) => {
    try {
      const result = await handler(input);
      return {
        success: result.ok !== false,
        data: result.data || result,
        error: result.error,
        ok: result.ok !== false
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        ok: false
      };
    }
  });
}
