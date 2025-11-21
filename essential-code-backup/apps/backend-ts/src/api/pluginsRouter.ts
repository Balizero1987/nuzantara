/**
 * Plugin API Routes - Express.js
 *
 * Provides REST API for plugin management and execution.
 */

import { Router } from 'express';
import { registry, executor, PluginCategory } from '../core/plugins';

const router = Router();

/**
 * List all available plugins
 * GET /api/plugins/list
 */
router.get('/list', async (req, res) => {
  try {
    const { category, tags, allowed_models } = req.query;

    // Parse filters
    let categoryFilter: PluginCategory | undefined;
    if (category && typeof category === 'string') {
      categoryFilter = category as PluginCategory;
    }

    const tagsFilter =
      tags && typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : undefined;

    const modelsFilter =
      allowed_models && typeof allowed_models === 'string'
        ? allowed_models.split(',').map((m) => m.trim())
        : undefined;

    const plugins = registry.listPlugins({
      category: categoryFilter,
      tags: tagsFilter,
      allowedModels: modelsFilter
    });

    res.json({
      success: true,
      count: plugins.length,
      plugins
    });
  } catch (error: any) {
    console.error('Error listing plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get plugin details
 * GET /api/plugins/:pluginName
 */
router.get('/:pluginName', async (req, res) => {
  try {
    const { pluginName } = req.params;

    const plugin = registry.get(pluginName);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: `Plugin ${pluginName} not found`
      });
    }

    const metadata = plugin.metadata;
    const inputSchema = plugin.inputSchema;
    const metrics = executor.getMetrics(pluginName);

    res.json({
      success: true,
      plugin: {
        metadata,
        inputSchema,
        metrics
      }
    });
  } catch (error: any) {
    console.error('Error getting plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute a plugin
 * POST /api/plugins/:pluginName/execute
 */
router.post('/:pluginName/execute', async (req, res) => {
  try {
    const { pluginName } = req.params;
    const { input_data, use_cache = true, user_id } = req.body;

    // Get user_id from header or body
    const userId = user_id || req.headers['x-user-id'];

    const plugin = registry.get(pluginName);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: `Plugin ${pluginName} not found`
      });
    }

    const result = await executor.execute(pluginName, input_data, {
      useCache: use_cache,
      userId: userId as string
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error executing plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get plugin metrics
 * GET /api/plugins/:pluginName/metrics
 */
router.get('/:pluginName/metrics', async (req, res) => {
  try {
    const { pluginName } = req.params;

    if (!registry.get(pluginName)) {
      return res.status(404).json({
        success: false,
        error: `Plugin ${pluginName} not found`
      });
    }

    const metrics = executor.getMetrics(pluginName);

    res.json({
      success: true,
      plugin: pluginName,
      metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all plugin metrics
 * GET /api/plugins/metrics/all
 */
router.get('/metrics/all', async (_req, res) => {
  try {
    const allMetrics = executor.getAllMetrics();

    res.json({
      success: true,
      metrics: allMetrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search plugins
 * POST /api/plugins/search
 */
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required'
      });
    }

    const results = registry.search(query.trim());

    res.json({
      success: true,
      query,
      count: results.length,
      results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get registry statistics
 * GET /api/plugins/statistics
 */
router.get('/statistics', async (_req, res) => {
  try {
    const stats = registry.getStatistics();

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Anthropic tool definitions
 * GET /api/plugins/tools/anthropic
 */
router.get('/tools/anthropic', async (req, res) => {
  try {
    const { model } = req.query;

    let tools;
    if (model === 'haiku') {
      tools = registry.getHaikuAllowedTools();
    } else {
      tools = registry.getAllAnthropicTools();
    }

    res.json({
      success: true,
      count: tools.length,
      tools
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reload plugin (admin only)
 * POST /api/plugins/:pluginName/reload
 */
router.post('/:pluginName/reload', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];

    // TODO: Add proper admin auth check
    if (!adminKey) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    const { pluginName } = req.params;

    await registry.reloadPlugin(pluginName);

    res.json({
      success: true,
      message: `Plugin ${pluginName} reloaded`
    });
  } catch (error: any) {
    console.error('Error reloading plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check
 * GET /api/plugins/health
 */
router.get('/health', async (_req, res) => {
  try {
    const stats = registry.getStatistics();

    res.json({
      success: true,
      status: 'healthy',
      plugins_loaded: stats.totalPlugins
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
