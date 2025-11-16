import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { ArrowUp, ArrowDown, Activity, DollarSign, FileText, Globe, Clock, AlertCircle } from 'lucide-react';
import { SourceStatusGrid } from '../components/SourceStatusGrid';
import { SystemHealth } from '../components/SystemHealth';

interface DashboardStats {
  articles: {
    total: number;
    published: number;
    pending: number;
    todayNew: number;
    weekGrowth: number;
  };
  sources: {
    total: number;
    active: number;
    failing: number;
    lastScraped: string;
  };
  processing: {
    queue: number;
    processing: number;
    completed: number;
    failed: number;
  };
  costs: {
    today: number;
    week: number;
    month: number;
    breakdown: {
      ai: number;
      images: number;
      infrastructure: number;
    };
  };
  performance: {
    avgScrapeTime: number;
    avgProcessTime: number;
    successRate: number;
    uptime: number;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  immigration: '#003366',
  business: '#1E3A8A',
  tax: '#4B5563',
  property: '#059669',
  bali_news: '#EC4899',
  ai_indonesia: '#6366F1',
  finance: '#16A34A'
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [costTrend, setCostTrend] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data.stats);
      setRealtimeData(data.realtime);
      setCategoryData(data.categories);
      setCostTrend(data.costTrend);
      setAlerts(data.alerts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Head>
        <title>Bali Zero Journal - Dashboard</title>
      </Head>

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-yellow-500">Bali Zero Journal</h1>
          <p className="text-gray-400 mt-2">News Intelligence System Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <span className="text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`p-4 rounded flex items-center gap-3 ${
              alert.type === 'error' ? 'bg-red-900/50' :
              alert.type === 'warning' ? 'bg-yellow-900/50' : 'bg-blue-900/50'
            }`}>
              <AlertCircle className="w-5 h-5" />
              <span>{alert.message}</span>
              <span className="text-sm text-gray-400 ml-auto">{alert.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Articles"
          value={stats?.articles.total || 0}
          change={stats?.articles.weekGrowth || 0}
          icon={<FileText className="w-6 h-6" />}
          color="bg-blue-600"
        />
        <MetricCard
          title="Active Sources"
          value={stats?.sources.active || 0}
          total={stats?.sources.total || 0}
          icon={<Globe className="w-6 h-6" />}
          color="bg-green-600"
        />
        <MetricCard
          title="Success Rate"
          value={`${stats?.performance.successRate || 0}%`}
          icon={<Activity className="w-6 h-6" />}
          color="bg-purple-600"
        />
        <MetricCard
          title="Monthly Cost"
          value={`$${stats?.costs.month?.toFixed(2) || '0.00'}`}
          change={-15}
          icon={<DollarSign className="w-6 h-6" />}
          color="bg-yellow-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Articles by Category */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Articles by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={CATEGORY_COLORS[entry.category] || '#666'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Processing Timeline */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Processing Activity (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="scraped" stroke="#10B981" name="Scraped" />
              <Line type="monotone" dataKey="processed" stroke="#3B82F6" name="Processed" />
              <Line type="monotone" dataKey="published" stroke="#F59E0B" name="Published" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Cost Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#fff' }} />
              <Legend />
              <Bar dataKey="ai" stackId="a" fill="#6366F1" name="AI Processing" />
              <Bar dataKey="images" stackId="a" fill="#EC4899" name="Image Generation" />
              <Bar dataKey="infrastructure" stackId="a" fill="#14B8A6" name="Infrastructure" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Cost Breakdown</h3>
          <div className="space-y-4">
            <CostItem
              label="AI Processing"
              value={stats?.costs.breakdown.ai || 0}
              percentage={(stats?.costs.breakdown.ai || 0) / (stats?.costs.month || 1) * 100}
              color="bg-blue-600"
            />
            <CostItem
              label="Image Generation"
              value={stats?.costs.breakdown.images || 0}
              percentage={(stats?.costs.breakdown.images || 0) / (stats?.costs.month || 1) * 100}
              color="bg-pink-600"
            />
            <CostItem
              label="Infrastructure"
              value={stats?.costs.breakdown.infrastructure || 0}
              percentage={(stats?.costs.breakdown.infrastructure || 0) / (stats?.costs.month || 1) * 100}
              color="bg-teal-600"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Monthly</span>
              <span className="text-2xl font-bold text-yellow-500">
                ${stats?.costs.month?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Source Status Grid */}
      <SourceStatusGrid />

      {/* System Health */}
      <SystemHealth stats={stats} />
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, change, total, icon, color }: any) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-3 rounded-lg`}>{icon}</div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-400 text-sm mt-1">{title}</div>
      {total && (
        <div className="text-gray-500 text-xs mt-2">of {total} total</div>
      )}
    </div>
  );
}

// Cost Item Component
function CostItem({ label, value, percentage, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>${value.toFixed(2)}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
      </div>
    </div>
  );
}

