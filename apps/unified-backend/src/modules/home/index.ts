import { Router, Request, Response } from 'express';

const router = Router();

// Homepage for the backend
router.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ZANTARA Backend API</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-width: 600px;
          margin: 2rem;
        }
        h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(90deg, #fff 0%, #f0f0f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        h2 {
          font-size: 1.2rem;
          opacity: 0.9;
          margin-bottom: 2rem;
          font-weight: 300;
        }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 255, 0, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 50px;
          margin-bottom: 2rem;
        }
        .status-dot {
          width: 10px;
          height: 10px;
          background: #00ff00;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .links {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2rem;
        }
        .link {
          display: inline-block;
          padding: 0.8rem 1.5rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .link:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        .tagline {
          margin-top: 3rem;
          font-style: italic;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔮 ZANTARA</h1>
        <h2>Backend API System</h2>

        <div class="status">
          <div class="status-dot"></div>
          <span>System Operational</span>
        </div>

        <p style="margin-bottom: 2rem; opacity: 0.9; line-height: 1.6;">
          The ZANTARA backend API is running successfully.<br>
          This is the core infrastructure powering Bali Zero's AI assistant.
        </p>

        <div class="links">
          <a href="/health" class="link">🏥 Health Status</a>
          <a href="/metrics" class="link">📊 Metrics</a>
          <a href="/api" class="link">🔌 API Documentation</a>
        </div>

        <p class="tagline">
          "From Zero to Infinity ∞"<br>
          <small style="opacity: 0.7">Bali Zero © 2025</small>
        </p>
      </div>
    </body>
    </html>
  `);
});

export default {
  router,
  initialize: async () => {
    console.log('Home module initialized');
  }
};