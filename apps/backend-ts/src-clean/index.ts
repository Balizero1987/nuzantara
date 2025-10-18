// NUZANTARA TypeScript Backend - Clean Version
// Core handlers only, no Google Cloud dependencies

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'NUZANTARA-TS-BACKEND',
    version: '5.2.0',
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({ 
    message: 'NUZANTARA Backend API',
    version: '5.2.0',
    status: 'running'
  });
});

// AI Chat endpoint (placeholder)
app.post('/chat', (req, res) => {
  res.json({
    ok: true,
    message: 'Chat endpoint ready - implement AI handlers',
    timestamp: new Date().toISOString()
  });
});

const server = createServer(app);

server.listen(port, () => {
  console.log(`🚀 NUZANTARA Backend running on port ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
});

export default app;