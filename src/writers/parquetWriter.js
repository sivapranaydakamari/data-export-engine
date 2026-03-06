const { Transform } = require('stream');
const parquet = require('@dsnp/parquetjs');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function createParquetWriter(columns) {

    const schemaDef = {};

    for (const col of columns) {

        if (col.source === 'id')
            schemaDef[col.target] = { type: 'INT64' };

        else if (col.source === 'value')
            schemaDef[col.target] = { type: 'DOUBLE' };

        else
            schemaDef[col.target] = { type: 'UTF8' };

    }

    const schema = new parquet.ParquetSchema(schemaDef);

    const tmpFile = path.join(os.tmpdir(), `export_${Date.now()}.parquet`);

    const writer = await parquet.ParquetWriter.openFile(schema, tmpFile);

    const transform = new Transform({
        objectMode: true,

        async transform(row, enc, cb) {

            const record = {};

            for (const col of columns) {

                let val = row[col.source];

                if (typeof val === 'object')
                    val = JSON.stringify(val);

                record[col.target] = val;
            }

            await writer.appendRow(record);

            cb();
        },

        async flush(cb) {

            await writer.close();

            const rs = fs.createReadStream(tmpFile);

            rs.on('end', () => fs.unlink(tmpFile, () => {}));

            rs.pipe(this.push ? this : process.stdout);

            cb();
        }
    });

    return transform;

}

module.exports = { createParquetWriter };