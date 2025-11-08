require('dotenv').config({ path: '/home/user/nuzantara/apps/backend-ts/.env' });

module.exports = {
  apps: [{
    name: 'nuzantara-backend',
    script: 'npx',
    args: 'tsx src/server.ts',
    cwd: '/home/user/nuzantara/apps/backend-ts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    merge_logs: true
  }]
};
