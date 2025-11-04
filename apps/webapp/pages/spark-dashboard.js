/**
 * ZANTARA Spark Monitoring Dashboard
 * Integrates with existing ZANTARA architecture
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SparkDashboard = () => {
  const [sparkStatus, setSparkStatus] = useState({});
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Spark cluster status
    const fetchSparkStatus = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/applications');
        const data = await response.json();
        setSparkStatus(data);
      } catch (error) {
        console.error('Failed to fetch Spark status:', error);
      }
    };

    // Fetch Spark jobs
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/spark/jobs');
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Failed to fetch Spark jobs:', error);
      }
    };

    // Fetch metrics
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/spark/metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch Spark metrics:', error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSparkStatus(), fetchJobs(), fetchMetrics()]);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Apache Spark Dashboard</h1>
        <Badge variant={sparkStatus.alive ? 'default' : 'destructive'}>
          {sparkStatus.alive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Cluster Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.workers || 0}</div>
            <p className="text-xs text-muted-foreground">Active nodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cores || 0}</div>
            <p className="text-xs text-muted-foreground">Total available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memory || '0 GB'}</div>
            <p className="text-xs text-muted-foreground">Total memory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.runningJobs || 0}</div>
            <p className="text-xs text-muted-foreground">Currently executing</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="kbli">KBLI Processing</TabsTrigger>
          <TabsTrigger value="metrics">Performance</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Spark Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{job.name}</h4>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Started: {new Date(job.startTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          job.status === 'RUNNING'
                            ? 'default'
                            : job.status === 'SUCCEEDED'
                              ? 'success'
                              : 'destructive'
                        }
                      >
                        {job.status}
                      </Badge>
                      <div className="mt-2">
                        <Progress value={job.progress || 0} className="w-32" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kbli" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>KBLI Data Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Records Processed</span>
                    <span className="font-medium">{metrics.kbliRecords || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories Analyzed</span>
                    <span className="font-medium">{metrics.categories || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Embeddings Generated</span>
                    <span className="font-medium">{metrics.embeddings || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Rate</span>
                    <span className="font-medium">{metrics.cacheHitRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>KBLI Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>High Risk Businesses</span>
                    <Badge variant="destructive">{metrics.highRisk || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Risk Businesses</span>
                    <Badge variant="warning">{metrics.mediumRisk || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Risk Businesses</span>
                    <Badge variant="success">{metrics.lowRisk || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Capital Requirement</span>
                    <span className="font-medium">Rp {metrics.avgCapital || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Resource Usage</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>{metrics.cpuUsage || 0}%</span>
                      </div>
                      <Progress value={metrics.cpuUsage || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>{metrics.memoryUsage || 0}%</span>
                      </div>
                      <Progress value={metrics.memoryUsage || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Disk I/O</span>
                        <span>{metrics.diskIO || 0}%</span>
                      </div>
                      <Progress value={metrics.diskIO || 0} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Job Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Jobs Completed</span>
                      <span className="font-medium">{metrics.jobsCompleted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jobs Failed</span>
                      <span className="font-medium">{metrics.jobsFailed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Job Duration</span>
                      <span className="font-medium">{metrics.avgJobDuration || 0}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Throughput</span>
                      <span className="font-medium">{metrics.throughput || 0} records/s</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                {metrics.logs?.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      log.level === 'ERROR'
                        ? 'bg-red-100 text-red-800'
                        : log.level === 'WARN'
                          ? 'bg-yellow-100 text-yellow-800'
                          : log.level === 'INFO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100'
                    }`}
                  >
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>{' '}
                    <span className="font-medium">[{log.level}]</span> {log.message}
                  </div>
                )) || <div className="text-muted-foreground">No logs available</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => window.open('http://localhost:8080', '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Open Spark UI
            </button>
            <button
              onClick={() => window.open('http://localhost:18080', '_blank')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Open History Server
            </button>
            <button
              onClick={() => alert('Triggering KBLI processing job...')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Run KBLI Job
            </button>
            <button
              onClick={() => alert('Clearing Spark cache...')}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Clear Cache
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SparkDashboard;
