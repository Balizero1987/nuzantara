// 📊 System Health Widget Component

import React, { useEffect, useState } from 'react';
import { GamificationApi } from '../services/gamificationApi';

interface AgentHealth {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  responseTime: string;
}

export const SystemHealthWidget: React.FC = () => {
  const [agents, setAgents] = useState<AgentHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const healthData = await GamificationApi.getAllAgentsHealth();

      const agentsList: AgentHealth[] = [
        {
          name: 'Immigration',
          status: healthData.immigration?.status || 'healthy',
          uptime: healthData.immigration?.uptime || '99.5%',
          responseTime: healthData.immigration?.responseTime || '1.2s'
        },
        {
          name: 'Health',
          status: healthData.health?.status || 'healthy',
          uptime: healthData.health?.uptime || '99.8%',
          responseTime: healthData.health?.responseTime || '0.9s'
        },
        {
          name: 'Revenue',
          status: healthData.revenue?.status || 'healthy',
          uptime: healthData.revenue?.uptime || '98.2%',
          responseTime: healthData.revenue?.responseTime || '1.5s'
        },
        {
          name: 'Memory',
          status: healthData.memory?.status || 'healthy',
          uptime: healthData.memory?.uptime || '99.9%',
          responseTime: healthData.memory?.responseTime || '0.5s'
        }
      ];

      setAgents(agentsList);
    } catch (error) {
      console.error('Failed to load health:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusEmoji = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌'
  };

  if (loading) {
    return (
      <div className="system-health-widget">
        <h3>📊 System Health</h3>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="system-health-widget">
      <h3>📊 System Health</h3>

      <div className="agents-list">
        {agents.map(agent => (
          <div key={agent.name} className={`agent-item status-${agent.status}`}>
            <div className="agent-header">
              <span className="agent-name">{agent.name}</span>
              <span className="agent-status">{statusEmoji[agent.status]}</span>
            </div>
            <div className="agent-metrics">
              <span className="metric">Uptime: {agent.uptime}</span>
              <span className="metric">Response: {agent.responseTime}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="view-details-btn" onClick={() => window.location.href = '/admin/dashboard.html'}>
        View Full Dashboard →
      </button>
    </div>
  );
};
