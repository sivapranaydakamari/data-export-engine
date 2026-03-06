const http = require('http');

const BASE_URL = 'http://localhost:8080';

function request(method, path, body) {
    return new Promise((resolve, reject) => {

        const url = new URL(path, BASE_URL);

        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method,
            headers: body ? { 'Content-Type': 'application/json' } : {}
        }, res => {

            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
                status: res.statusCode,
                headers: res.headers,
                body: data
            }));

        });

        req.on('error', reject);

        if (body) req.write(JSON.stringify(body));

        req.end();
    });
}

async function runTests() {

    const columns = [
        { source: 'id', target: 'id' },
        { source: 'name', target: 'name' },
        { source: 'value', target: 'amount' },
        { source: 'metadata', target: 'meta' }
    ];

    console.log("Checking server health...");

    const health = await request('GET', '/health');

    console.log("Health status:", health.status);
    console.log(health.body);

    console.log("\nTesting CSV export...");

    const csvJob = JSON.parse(
        (await request('POST', '/exports', { format: 'csv', columns })).body
    );

    console.log("CSV Job ID:", csvJob.exportId);

    const csvHeaders = await request(
        'GET',
        `/exports/${csvJob.exportId}/download`
    );

    console.log("CSV Content-Type:", csvHeaders.headers['content-type']);

    console.log("\nTesting JSON export...");

    const jsonJob = JSON.parse(
        (await request('POST', '/exports', { format: 'json', columns })).body
    );

    console.log("JSON Job ID:", jsonJob.exportId);

    const jsonHeaders = await request(
        'GET',
        `/exports/${jsonJob.exportId}/download`
    );

    console.log("JSON Content-Type:", jsonHeaders.headers['content-type']);

    console.log("\nTesting XML export...");

    const xmlJob = JSON.parse(
        (await request('POST', '/exports', { format: 'xml', columns })).body
    );

    console.log("XML Job ID:", xmlJob.exportId);

    const xmlHeaders = await request(
        'GET',
        `/exports/${xmlJob.exportId}/download`
    );

    console.log("XML Content-Type:", xmlHeaders.headers['content-type']);

    console.log("\nTesting Parquet export...");

    const parquetJob = JSON.parse(
        (await request('POST', '/exports', { format: 'parquet', columns })).body
    );

    console.log("Parquet Job ID:", parquetJob.exportId);

    const parquetHeaders = await request(
        'GET',
        `/exports/${parquetJob.exportId}/download`
    );

    console.log("Parquet Content-Type:", parquetHeaders.headers['content-type']);

    console.log("\nTesting GZIP compression...");

    const gzipJob = JSON.parse(
        (await request('POST', '/exports', {
            format: 'csv',
            columns,
            compression: 'gzip'
        })).body
    );

    const gzipHeaders = await request(
        'GET',
        `/exports/${gzipJob.exportId}/download`
    );

    console.log("GZIP Content-Encoding:", gzipHeaders.headers['content-encoding']);

    console.log("\nAll simple checks completed.");
}

runTests().catch(console.error);