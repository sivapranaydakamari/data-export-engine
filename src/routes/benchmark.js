const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pipeline } = require('stream/promises');
const { streamQuery } = require('../db');
const { createCsvWriter } = require('../writers/csvWriter');
const { createJsonWriter } = require('../writers/jsonWriter');
const { createXmlWriter } = require('../writers/xmlWriter');
const { createParquetWriter } = require('../writers/parquetWriter');

const router = express.Router();

const BENCHMARK_COLUMNS = [
    { source: 'id', target: 'id' },
    { source: 'created_at', target: 'created_at' },
    { source: 'name', target: 'name' },
    { source: 'value', target: 'value' },
    { source: 'metadata', target: 'metadata' },
];

const SQL = 'SELECT id, created_at, name, value, metadata FROM records';

async function benchmarkFormat(format) {

    const tmpFile = path.join(os.tmpdir(), `benchmark_${format}.tmp`);
    const start = Date.now();

    const { stream: dbStream } = await streamQuery(SQL);
    const fileStream = fs.createWriteStream(tmpFile);

    let writer;

    if (format === 'csv') writer = createCsvWriter(BENCHMARK_COLUMNS);
    if (format === 'json') writer = createJsonWriter(BENCHMARK_COLUMNS);
    if (format === 'xml') writer = createXmlWriter(BENCHMARK_COLUMNS);
    if (format === 'parquet') writer = await createParquetWriter(BENCHMARK_COLUMNS);

    await pipeline(dbStream, writer, fileStream);

    const durationSeconds = (Date.now() - start) / 1000;

    const stats = fs.statSync(tmpFile);

    const peakMemoryMB =
        Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100;

    fs.unlinkSync(tmpFile);

    return {
        format,
        durationSeconds: Math.round(durationSeconds * 100) / 100,
        fileSizeBytes: stats.size,
        peakMemoryMB
    };
}

router.get('/', async (req, res) => {

    try {

        const formats = ['csv', 'json', 'xml', 'parquet'];
        const results = [];

        for (const format of formats) {
            const result = await benchmarkFormat(format);
            results.push(result);
        }

        res.json({
            datasetRowCount: 10000000,
            results
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Benchmark failed' });
    }
});

module.exports = router;