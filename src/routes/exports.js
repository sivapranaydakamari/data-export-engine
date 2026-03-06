const express = require('express');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');
const { streamQuery } = require('../db');
const { createJob, getJob } = require('../jobStore');
const { createCsvWriter } = require('../writers/csvWriter');
const { createJsonWriter } = require('../writers/jsonWriter');
const { createXmlWriter } = require('../writers/xmlWriter');
const { createParquetWriter } = require('../writers/parquetWriter');

const router = express.Router();

const ALLOWED_COLUMNS = ['id', 'created_at', 'name', 'value', 'metadata'];
const VALID_FORMATS = ['csv', 'json', 'xml', 'parquet'];

router.post('/', (req, res) => {
    try {
        const { format, columns, compression } = req.body;

        if (!format || !VALID_FORMATS.includes(format)) {
            return res.status(400).json({
                error: `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}`,
            });
        }

        if (!columns || !Array.isArray(columns) || columns.length === 0) {
            return res.status(400).json({
                error: 'columns must be a non-empty array of {source, target} objects',
            });
        }

        for (const col of columns) {
            if (!col.source || !col.target) {
                return res.status(400).json({
                    error: 'Each column must have "source" and "target" fields',
                });
            }
            if (!ALLOWED_COLUMNS.includes(col.source)) {
                return res.status(400).json({
                    error: `Invalid source column "${col.source}". Allowed: ${ALLOWED_COLUMNS.join(', ')}`,
                });
            }
        }

        if (compression && compression !== 'gzip') {
            return res.status(400).json({
                error: 'Only "gzip" compression is supported',
            });
        }

        if (compression === 'gzip' && format === 'parquet') {
            return res.status(400).json({
                error: 'Gzip compression is not applicable for Parquet format (already compressed)',
            });
        }

        const result = createJob(format, columns, compression || null);
        return res.status(201).json(result);
    } catch (err) {
        console.error('Error creating export job:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:exportId/download', async (req, res) => {

    const job = getJob(req.params.exportId);
    if (!job) return res.status(404).json({ error: "Export job not found" });

    const { format, columns, compression } = job;

    const sourceColumns = columns.map(c => `"${c.source}"`).join(', ');
    const sql = `SELECT ${sourceColumns} FROM records`;

    const { stream: dbStream } = await streamQuery(sql);

    const contentTypes = {
        csv: "text/csv",
        json: "application/json",
        xml: "application/xml",
        parquet: "application/octet-stream"
    };

    res.setHeader("Content-Type", contentTypes[format]);
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="export.${format}"`
    );

    if (format === "parquet") {
        const parquetWriter = await createParquetWriter(columns);
        await parquetWriter(dbStream, res);
        return;
    }

    const writers = {
        csv: createCsvWriter,
        json: createJsonWriter,
        xml: createXmlWriter
    };

    const writer = writers[format](columns);

    let output = dbStream.pipe(writer);

    if (compression === "gzip") {
        const gzip = zlib.createGzip();
        res.setHeader("Content-Encoding", "gzip");
        output = output.pipe(gzip);
    }

    output.pipe(res);

});

module.exports = router;
