/**
 * Plugin Marketplace Component
 *
 * Admin dashboard for managing and monitoring plugins.
 */

import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/login-utils';

interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  category: string;
  tags: string[];
  requiresAuth: boolean;
  requiresAdmin: boolean;
  estimatedTime: number;
  rateLimit?: number;
  allowedModels: string[];
}

interface PluginMetrics {
  calls: number;
  successes: number;
  failures: number;
  avgTime: number;
  successRate: number;
  cacheHitRate: number;
}

interface Plugin {
  metadata: PluginMetadata;
  metrics?: PluginMetrics;
}

export const PluginMarketplace: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const categories = [
    'all',
    'ai-services',
    'analytics',
    'auth',
    'bali-zero',
    'communication',
    'google-workspace',
    'identity',
    'intel',
    'maps',
    'memory',
    'rag',
    'system',
    'zantara'
  ];

  useEffect(() => {
    fetchPlugins();
  }, [category]);

  useEffect(() => {
    filterPlugins();
  }, [search, plugins]);

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const params = category !== 'all' ? `?category=${category}` : '';
      const response = await fetch(`/api/plugins/list${params}`);
      const data = await response.json();

      if (data.success) {
        setPlugins(data.plugins);
      }
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlugins = () => {
    if (!search) {
      setFilteredPlugins(plugins);
      return;
    }

    const query = search.toLowerCase();
    const filtered = plugins.filter(
      (p) =>
        p.metadata.name.toLowerCase().includes(query) ||
        p.metadata.description.toLowerCase().includes(query) ||
        p.metadata.tags.some((tag) => tag.toLowerCase().includes(query))
    );

    setFilteredPlugins(filtered);
  };

  const fetchPluginDetails = async (pluginName: string) => {
    try {
      const response = await fetch(`/api/plugins/${pluginName}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPlugin({
          metadata: data.plugin.metadata,
          metrics: data.plugin.metrics
        });
      }
    } catch (error) {
      console.error('Failed to fetch plugin details:', error);
    }
  };

  const reloadPlugin = async (pluginName: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`/api/plugins/${pluginName}/reload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(`Plugin ${pluginName} reloaded successfully`);
        fetchPlugins();
      } else {
        alert(data.error || 'Failed to reload plugin');
      }
    } catch (error) {
      console.error('Failed to reload plugin:', error);
      alert('Failed to reload plugin');
    }
  };

  return (
    <div className="plugin-marketplace">
      <div className="marketplace-header">
        <h1>Plugin Marketplace</h1>
        <p>
          Manage and monitor all ZANTARA plugins. {plugins.length} plugins loaded.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="marketplace-controls">
        <input
          type="text"
          placeholder="Search plugins by name, description, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.replace(/-/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>

        <button onClick={fetchPlugins} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {/* Plugin Grid */}
      <div className="plugin-grid">
        {loading ? (
          <div className="loading">Loading plugins...</div>
        ) : filteredPlugins.length === 0 ? (
          <div className="no-results">No plugins found matching your criteria</div>
        ) : (
          filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.metadata.name}
              plugin={plugin}
              onClick={() => fetchPluginDetails(plugin.metadata.name)}
              onReload={() => reloadPlugin(plugin.metadata.name)}
            />
          ))
        )}
      </div>

      {/* Plugin Details Modal */}
      {selectedPlugin && (
        <PluginDetailsModal
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
        />
      )}
    </div>
  );
};

interface PluginCardProps {
  plugin: Plugin;
  onClick: () => void;
  onReload: () => void;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, onClick, onReload }) => {
  const { metadata } = plugin;

  return (
    <div className="plugin-card" onClick={onClick}>
      <div className="plugin-card-header">
        <h3>{metadata.name}</h3>
        <span className="plugin-version">v{metadata.version}</span>
      </div>

      <p className="plugin-description">{metadata.description}</p>

      <div className="plugin-tags">
        {metadata.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="plugin-tag">
            {tag}
          </span>
        ))}
        {metadata.tags.length > 3 && (
          <span className="plugin-tag-more">+{metadata.tags.length - 3}</span>
        )}
      </div>

      <div className="plugin-meta">
        <div className="meta-item">
          <span className="meta-label">Category:</span>
          <span className="meta-value">{metadata.category}</span>
        </div>

        <div className="meta-item">
          <span className="meta-label">Auth:</span>
          <span className="meta-value">
            {metadata.requiresAuth ? '🔒 Required' : '🔓 Not Required'}
          </span>
        </div>

        {metadata.rateLimit && (
          <div className="meta-item">
            <span className="meta-label">Rate Limit:</span>
            <span className="meta-value">{metadata.rateLimit}/min</span>
          </div>
        )}
      </div>

      <div className="plugin-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="btn-view"
        >
          View Details
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReload();
          }}
          className="btn-reload"
        >
          ↻ Reload
        </button>
      </div>
    </div>
  );
};

interface PluginDetailsModalProps {
  plugin: Plugin;
  onClose: () => void;
}

const PluginDetailsModal: React.FC<PluginDetailsModalProps> = ({ plugin, onClose }) => {
  const { metadata, metrics } = plugin;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{metadata.name}</h2>
          <button onClick={onClose} className="btn-close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Description */}
          <section>
            <h3>Description</h3>
            <p>{metadata.description}</p>
          </section>

          {/* Metadata */}
          <section>
            <h3>Metadata</h3>
            <table className="details-table">
              <tbody>
                <tr>
                  <td>Version</td>
                  <td>{metadata.version}</td>
                </tr>
                <tr>
                  <td>Category</td>
                  <td>{metadata.category}</td>
                </tr>
                <tr>
                  <td>Estimated Time</td>
                  <td>{metadata.estimatedTime}s</td>
                </tr>
                <tr>
                  <td>Rate Limit</td>
                  <td>{metadata.rateLimit || 'None'}</td>
                </tr>
                <tr>
                  <td>Requires Auth</td>
                  <td>{metadata.requiresAuth ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td>Admin Only</td>
                  <td>{metadata.requiresAdmin ? 'Yes' : 'No'}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Tags */}
          <section>
            <h3>Tags</h3>
            <div className="plugin-tags">
              {metadata.tags.map((tag) => (
                <span key={tag} className="plugin-tag">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Allowed Models */}
          <section>
            <h3>Allowed Models</h3>
            <p>{metadata.allowedModels.join(', ')}</p>
          </section>

          {/* Performance Metrics */}
          {metrics && (
            <section>
              <h3>Performance Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">{metrics.calls}</div>
                  <div className="metric-label">Total Calls</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">
                    {(metrics.successRate * 100).toFixed(1)}%
                  </div>
                  <div className="metric-label">Success Rate</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{metrics.avgTime.toFixed(2)}s</div>
                  <div className="metric-label">Avg Time</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">
                    {(metrics.cacheHitRate * 100).toFixed(1)}%
                  </div>
                  <div className="metric-label">Cache Hit Rate</div>
                </div>
              </div>
            </section>
          )}

          {/* API Usage */}
          <section>
            <h3>API Usage</h3>
            <pre className="code-block">
              {`curl -X POST /api/plugins/${metadata.name}/execute \\
  -H 'Content-Type: application/json' \\
  -d '{
    "input_data": {
      // Your input data
    }
  }'`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PluginMarketplace;
