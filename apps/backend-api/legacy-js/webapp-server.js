// Simple Express server to serve ZANTARA Intelligence v6 HTML interfaces
import express from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ZANTARA Intelligence v6 Interfaces',
    timestamp: new Date().toISOString()
  });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/zantara-intelligence-v6.html');
});

// Serve HTML interfaces
app.get('/zantara-intelligence-v6.html', (req, res) => {
  try {
    const html = readFileSync('zantara-intelligence-v6.html', 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).send('Interface not found');
  }
});

app.get('/zantara-conversation-demo.html', (req, res) => {
  try {
    const html = readFileSync('zantara-conversation-demo.html', 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).send('Demo not found');
  }
});

app.get('/zantara-production.html', (req, res) => {
  try {
    const html = readFileSync('zantara-production.html', 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).send('Production page not found');
  }
});

app.listen(PORT, () => {
  console.log(`🌐 ZANTARA Intelligence v6 Interfaces running on port ${PORT}`);
  console.log(`📋 Available interfaces:`);
  console.log(`   • Main Interface: http://localhost:${PORT}/zantara-intelligence-v6.html`);
  console.log(`   • Live Demo: http://localhost:${PORT}/zantara-conversation-demo.html`);
  console.log(`   • Landing Page: http://localhost:${PORT}/zantara-production.html`);
});