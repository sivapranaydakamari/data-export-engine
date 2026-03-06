# Data Export Engine (Streaming)

## Overview

This project implements a **high-performance data export service** that streams large datasets from PostgreSQL into multiple formats: **CSV, JSON, XML, and Parquet**.

The key goal is to export **10 million records** while keeping **memory usage low (≤256MB)** by using streaming techniques instead of loading all data into memory.

This kind of system is commonly used in **data pipelines, reporting tools, and APIs** where different consumers require different data formats.

---

## Features

* Stream export of large datasets (10M rows)
* Supports multiple formats:

  * CSV
  * JSON
  * XML
  * Parquet
* Optional **gzip compression** for CSV, JSON, and XML
* Handles **nested JSONB data**
* **Constant memory usage** with streaming
* Built-in **benchmark endpoint** to measure performance
* Fully **containerized using Docker**

---

## Tech Stack

* **Node.js + Express**
* **PostgreSQL**
* **Docker & Docker Compose**
* Node Streams
* pg-query-stream
* parquetjs-lite

---

## Project Structure

```
.
├── docker-compose.yml
├── Dockerfile
├── init-db.sh
├── src/
│   ├── index.js
│   ├── db.js
│   ├── jobStore.js
│   ├── routes/
│   │   ├── exports.js
│   │   └── benchmark.js
│   └── writers/
│       ├── csvWriter.js
│       ├── jsonWriter.js
│       ├── xmlWriter.js
│       └── parquetWriter.js
```

---

## Running the Project

Start everything using Docker:

```
docker-compose up --build
```

The system will:

1. Start PostgreSQL
2. Create the `records` table
3. Seed **10,000,000 rows**
4. Start the export API server on **port 8080**

---

## API Endpoints

### Create Export Job

```
POST /exports
```

Example request:

```json
{
  "format": "csv",
  "columns": [
    {"source": "id", "target": "id"},
    {"source": "name", "target": "name"},
    {"source": "metadata", "target": "metadata"}
  ]
}
```

Response:

```json
{
  "exportId": "uuid",
  "status": "pending"
}
```

---

### Download Export

```
GET /exports/{exportId}/download
```

Streams the dataset in the requested format.

---

### Benchmark Performance

```
GET /exports/benchmark
```

Returns performance metrics for each format:

* Export duration
* File size
* Peak memory usage

---

## Streaming Approach

Instead of loading the entire dataset into memory, the system streams rows:

```
PostgreSQL Cursor
      ↓
Node Transform Stream
      ↓
Format Writer (CSV / JSON / XML / Parquet)
      ↓
Optional gzip compression
      ↓
HTTP Response
```

This ensures the system can export **very large datasets safely**.

---

## Supported Data Formats

| Format  | Description                 |
| ------- | --------------------------- |
| CSV     | Row-based text format       |
| JSON    | Structured array of objects |
| XML     | Hierarchical document       |
| Parquet | Columnar binary format      |

Nested JSON data from the `metadata` column is handled appropriately for each format.

---

## Benchmark Example Output

```json
{
  "datasetRowCount": 10000000,
  "results": [
    {
      "format": "csv",
      "durationSeconds": 12.5,
      "fileSizeBytes": 850000000,
      "peakMemoryMB": 40
    }
  ]
}
```

---

## Notes

* The application runs with a **256MB memory limit** to ensure efficient streaming.
* The database seeding script generates **10M rows automatically**.
* Parquet exports are written to a temporary file before streaming.

---
