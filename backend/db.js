const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    throw new Error('FATAL: DATABASE_URL environment variable is not defined.');
}

const isProduction = process.env.NODE_ENV === 'production';

// You can control SSL cert verification via env var (default to false for Neon DB)
const sslConfig = isProduction
    ? { rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false;

console.log(`Connecting to PostgreSQL DB (${isProduction ? 'production' : 'development'}) with SSL: ${!!sslConfig}`);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    keepAlive: true,
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client:', err);
    // Exiting is an option, but consider monitoring/restarting externally
    process.exit(-1);
});

async function testConnectionWithRetry(maxRetries = 3, delayMs = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await pool.query('SELECT NOW()');
            console.log('✅ PostgreSQL database connected successfully!');
            return;
        } catch (err) {
            console.error(`❌ Attempt ${attempt} - Failed to connect to PostgreSQL:`, err.message);
            if (attempt === maxRetries) {
                console.error('❌ Max connection attempts reached. Exiting process.');
                process.exit(1);
            }
            console.log(`⏳ Retrying connection in ${delayMs / 1000} seconds...`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}

// Test connection on startup with retry
testConnectionWithRetry();

module.exports = pool;
