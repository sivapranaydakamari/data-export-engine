const { Pool } = require('pg');
const QueryStream = require('pg-query-stream');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function streamQuery(sql, params = [], batchSize = 5000) {

  const client = await pool.connect();

  const query = new QueryStream(sql, params, { batchSize });

  const stream = client.query(query);

  const releaseClient = () => client.release();

  stream.on('end', releaseClient);
  stream.on('error', releaseClient);
  stream.on('close', releaseClient);

  return { stream };
}

async function query(sql, params = []) {
  return pool.query(sql, params);
}

module.exports = { pool, streamQuery, query };