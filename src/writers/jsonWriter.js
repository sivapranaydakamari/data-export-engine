const { Transform } = require('stream');

function createJsonWriter(columns) {

    let first = true;

    return new Transform({
        objectMode: true,

        transform(row, enc, cb) {

            const obj = {};

            for (const col of columns) {
                obj[col.target] = row[col.source];
            }

            const json = JSON.stringify(obj);

            if (first) {
                first = false;
                cb(null, '[\n' + json);
            } else {
                cb(null, ',\n' + json);
            }
        },

        flush(cb) {

            if (first) {
                cb(null, '[]');
            } else {
                cb(null, '\n]');
            }

        }
    });

}

module.exports = { createJsonWriter };