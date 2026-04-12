const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env.production') })
require('dotenv').config({ path: path.join(__dirname, '.env') })

const nodeEnv = process.env.NODE_ENV || 'production'
const port = String(process.env.PORT || '3100')
const hostname = process.env.HOSTNAME || '127.0.0.1'

/**
 * PM2 — production (`.env.production` puis `.env`).
 */
module.exports = {
  apps: [
    {
      name: 'finance-pilot',
      cwd: __dirname,
      script: 'pnpm',
      args: 'start',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: nodeEnv,
        PORT: port,
        HOSTNAME: hostname,
      },
    },
  ],
}
