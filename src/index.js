const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

// Parse JSON requests
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            error: err.message
        });
    }
});

// Routes
const exportsRouter = require('./routes/exports');
const benchmarkRouter = require('./routes/benchmark');

app.use('/exports/benchmark', benchmarkRouter);
app.use('/exports', exportsRouter);

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
Data Export Engine running on port ${PORT}

POST /exports
GET  /exports/:id/download
GET  /exports/benchmark
GET  /health
`);
});

async function shutdown() {
    console.log('Shutting down...');
    await pool.end();
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);