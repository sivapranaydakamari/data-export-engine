const { Transform } = require('stream');

/**
 * Create a CSV writer transform stream
 * @param {Array<{source: string, target: string}>} columns
 */
function createCsvWriter(columns) {

    const headers = columns.map(c => c.target);
    const sourceKeys = columns.map(c => c.source);

    let headerWritten = false;

    return new Transform({
        objectMode: true,

        transform(row, encoding, callback) {

            let output = '';

            if (!headerWritten) {
                output += headers.join(',') + '\n';
                headerWritten = true;
            }

            const values = sourceKeys.map(key => {
                let val = row[key];

                if (val === null || val === undefined) return '';

                if (typeof val === 'object') {
                    val = JSON.stringify(val);
                }

                val = String(val).replace(/"/g, '""');

                return `"${val}"`;
            });

            output += values.join(',') + '\n';

            callback(null, output);
        }
    });
}

module.exports = { createCsvWriter };