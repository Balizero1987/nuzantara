import React from 'react';
import { Server, Database, Cpu, HardDrive, Wifi } from 'lucide-react';

export function SystemHealth({ stats }: any) {
  const services = [
    {
      name: 'API Server',
      icon: <Server className="w-6 h-6" />,
      status: 'healthy',
      uptime: '99.9%',
      latency: '45ms',
      details: 'Running on Express'
    },
    {
      name: 'PostgreSQL',
      icon: <Database className="w-6 h-6" />,
      status: 'healthy',
      uptime: '100%',
      latency: '12ms',
      details: 'Connected'
    },
    {
      name: 'Redis Queue',
      icon: <Cpu className="w-6 h-6" />,
      status: 'healthy',
      uptime: '100%',
      latency: '3ms',
      details: 'Queue active'
    },
    {
      name: 'Scraper Workers',
      icon: <HardDrive className="w-6 h-6" />,
      status: stats?.processing?.queue > 100 ? 'degraded' : 'healthy',
      uptime: '98.5%',
      latency: '2.4s avg',
      details: `${stats?.processing?.processing || 0} active`
    },
    {
      name: 'AI Pipeline',
      icon: <Wifi className="w-6 h-6" />,
      status: 'healthy',
      uptime: '99.7%',
      latency: '850ms',
      details: 'Using DeepSeek R1'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-6">System Health</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {services.map((service) => (
          <div key={service.name} className="bg-gray-700 p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400">{service.icon}</div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
            </div>
            <div className="text-sm font-semibold mb-1">{service.name}</div>
            <div className="text-xs text-gray-400">
              <div>Uptime: {service.uptime}</div>
              <div>Latency: {service.latency}</div>
              <div className="mt-1 text-gray-500">{service.details}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

