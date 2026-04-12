const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env.production') })
require('dotenv').config({ path: path.join(__dirname, '.env') })

const nodeEnv = process.env.NODE_ENV || 'production'
const port = String(process.env.PORT || '3100')
const hostname = process.env.HOSTNAME || '127.0.0.1'

/**
 * PM2 — production (variables depuis `.env.production` puis `.env` à la racine).
 *
 *   cp config/environments/production.env.example .env.production
 *   cd /chemin/vers/finance-pilot
 *   pnpm install --frozen-lockfile
 *   pnpm build
 *   pm2 start ecosystem.config.cjs
 *
 *   pm2 save
 *   pm2 startup   # pour relancer au boot (suivre les instructions affichées)
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
