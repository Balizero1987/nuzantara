import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { JobRequest, JobResponse } from './types';
import { JobExecutor } from './job-executor';
import config from './config';
import logger from './logger';

const app = express();
const jobExecutor = new JobExecutor();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  }, 'Incoming request');
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await jobExecutor.healthCheck();

    res.status(health.healthy ? 200 : 503).json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      service: 'zantara-integrations-orchestrator',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      ...health.details
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Health check failed');
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Main job execution endpoint
app.post('/job', async (req, res) => {
  // NO API KEY CHECK - COMPLETELY PUBLIC
  try {
    const jobRequest: JobRequest = req.body;

    // Basic validation
    if (!jobRequest.integration || !jobRequest.params) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: integration and params'
      });
    }

    logger.info({
      integration: jobRequest.integration,
      hasOptions: !!jobRequest.options
    }, 'Processing job request');

    // Execute the job
    const response: JobResponse = await jobExecutor.executeJob(jobRequest);

    // Return appropriate HTTP status based on job success
    const status = response.ok ? 200 : 400;
    res.status(status).json(response);

  } catch (error: any) {
    logger.error({ error: error.message }, 'Job processing failed');

    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error.message}`,
      jobId: 'unknown',
      executionTime: 0,
      retries: 0,
      processedBy: []
    });
  }
});

// Job status endpoint
app.get('/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const execution = jobExecutor.getExecution(jobId);

  if (!execution) {
    return res.status(404).json({
      ok: false,
      error: 'Job not found'
    });
  }

  res.json({
    ok: true,
    data: {
      jobId: execution.jobId,
      integration: execution.integration,
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      executionTime: execution.endTime ? execution.endTime - execution.startTime : Date.now() - execution.startTime,
      retries: execution.retries,
      processedBy: execution.processedBy,
      errors: execution.errors
    }
  });
});

// List all active jobs
app.get('/jobs', (req, res) => {
  const executions = jobExecutor.getAllExecutions();

  res.json({
    ok: true,
    data: {
      total: executions.length,
      active: executions.filter(e => e.status === 'processing').length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      executions: executions.map(e => ({
        jobId: e.jobId,
        integration: e.integration,
        status: e.status,
        startTime: e.startTime,
        retries: e.retries
      }))
    }
  });
});

// Cleanup endpoint (manual cleanup of old executions)
app.post('/cleanup', (req, res) => {
  const beforeCount = jobExecutor.getAllExecutions().length;
  jobExecutor.clearCompletedExecutions();
  const afterCount = jobExecutor.getAllExecutions().length;

  logger.info({
    beforeCount,
    afterCount,
    cleaned: beforeCount - afterCount
  }, 'Cleaned up completed executions');

  res.json({
    ok: true,
    data: {
      beforeCount,
      afterCount,
      cleaned: beforeCount - afterCount
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  }, 'Unhandled error');

  res.status(500).json({
    ok: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Endpoint not found',
    available: [
      'GET /health - Health check',
      'POST /job - Execute integration job',
      'GET /job/:jobId - Get job status',
      'GET /jobs - List all jobs',
      'POST /cleanup - Clean old executions'
    ]
  });
});

// Start server
const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info({
    port: config.port,
    zantaraUrl: config.zantaraGatewayUrl,
    nodeEnv: process.env.NODE_ENV || 'development'
  }, 'ZANTARA Integrations Orchestrator started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;