#!/bin/bash
set -e

echo "Initializing database schema and seeding data..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'EOSQL'

CREATE TABLE IF NOT EXISTS records (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    value DECIMAL(18,4) NOT NULL,
    metadata JSONB NOT NULL
);

DO $$
DECLARE
    row_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO row_count FROM records;

    IF row_count = 10000000 THEN
        RAISE NOTICE 'Table already seeded with 10M rows.';
        RETURN;
    END IF;

    RAISE NOTICE 'Seeding 10,000,000 rows...';

    TRUNCATE TABLE records RESTART IDENTITY;

    INSERT INTO records (created_at, name, value, metadata)
    SELECT
        TIMESTAMP '2020-01-01' + (i % 1461) * INTERVAL '1 day',
        'record_' || i,
        ROUND((random()*100000)::numeric, 4),
        jsonb_build_object(
            'city', (ARRAY[
                'New York','London','Tokyo','Paris','Sydney',
                'Berlin','Toronto','Mumbai','Dubai','Singapore'
            ])[1 + (i % 10)],
            'zip', LPAD(((i*7+13)%100000)::text,5,'0'),
            'score', (i % 1000)
        )
    FROM generate_series(1,10000000) s(i);

    RAISE NOTICE 'Seeding complete.';
END $$;

CREATE INDEX IF NOT EXISTS idx_records_created_at
ON records(created_at);

EOSQL

echo "Database initialization complete."