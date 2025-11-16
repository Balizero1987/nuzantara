import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface SourceStatus {
  id: string;
  name: string;
  category: string;
  tier: string;
  status: 'healthy' | 'degraded' | 'failed' | 'pending';
  lastScraped: string;
  articlesScraped: number;
  successRate: number;
  responseTime: number;
}

export function SourceStatusGrid() {
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSourceStatus();
  }, [filter]);

  const fetchSourceStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sources/status?filter=${filter}`);
      const data = await response.json();
      setSources(data);
    } catch (error) {
      console.error('Failed to fetch source status:', error);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      'T1': 'bg-yellow-600',
      'T2': 'bg-blue-600',
      'T3': 'bg-gray-600'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[tier] || 'bg-gray-600'}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Source Status Monitor</h3>
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            <option value="all">All Sources</option>
            <option value="T1">Tier 1 Only</option>
            <option value="T2">Tier 2 Only</option>
            <option value="T3">Tier 3 Only</option>
            <option value="failed">Failed Only</option>
          </select>
          <button
            onClick={fetchSourceStatus}
            className="bg-blue-600 px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => (
          <div key={source.id} className="bg-gray-700 p-4 rounded">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-semibold text-sm">{source.name}</div>
                <div className="text-xs text-gray-400 mt-1">{source.category}</div>
              </div>
              <div className="flex items-center gap-2">
                {getTierBadge(source.tier)}
                {getStatusIcon(source.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mt-3">
              <div>
                <span className="text-gray-400">Last Scraped:</span>
                <div className="text-white">{source.lastScraped}</div>
              </div>
              <div>
                <span className="text-gray-400">Articles:</span>
                <div className="text-white">{source.articlesScraped}</div>
              </div>
              <div>
                <span className="text-gray-400">Success Rate:</span>
                <div className={source.successRate > 80 ? 'text-green-400' : 'text-yellow-400'}>
                  {source.successRate}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Response:</span>
                <div className="text-white">{source.responseTime}ms</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

