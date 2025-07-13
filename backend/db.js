const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    throw new Error('FATAL: DATABASE_URL environment variable is not defined.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client in PG pool', err);
    process.exit(-1);
});

// Test database connection
(async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('PostgreSQL database connected successfully!');
    } catch (err) {
        console.error('Failed to connect to PostgreSQL database:', err.message);
        process.exit(1);
    }
})();

module.exports = pool;