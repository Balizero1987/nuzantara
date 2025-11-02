/**
 * 🧪 Simple Test Server - Direct Handler Testing
 */

import express from 'express';
import { zantaraUnifiedQuery } from './src/handlers/zantara-v3/zantara-unified.js';

const app = express();
app.use(express.json());

// Direct endpoint without middleware wrapping
app.post('/test/unified', async (req, res) => {
  await zantaraUnifiedQuery(req, res);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`📋 Test endpoint: POST http://localhost:${PORT}/test/unified`);
});
