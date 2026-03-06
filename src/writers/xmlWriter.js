const { Transform } = require('stream');

function escapeXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function objectToXml(key, value) {

    if (value === null || value === undefined) {
        return `<${key}></${key}>`;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        let inner = '';
        for (const k in value) {
            inner += objectToXml(k, value[k]);
        }
        return `<${key}>${inner}</${key}>`;
    }

    if (Array.isArray(value)) {
        return value.map(v => objectToXml('item', v)).join('');
    }

    return `<${key}>${escapeXml(value)}</${key}>`;
}

function createXmlWriter(columns) {

    let started = false;

    return new Transform({
        objectMode: true,

        transform(row, enc, cb) {

            let xml = '';

            if (!started) {
                xml += '<?xml version="1.0" encoding="UTF-8"?>\n<records>\n';
                started = true;
            }

            xml += '<record>';

            for (const col of columns) {
                xml += objectToXml(col.target, row[col.source]);
            }

            xml += '</record>\n';

            cb(null, xml);
        },

        flush(cb) {
            if (started) {
                cb(null, '</records>');
            } else {
                cb(null, '<?xml version="1.0" encoding="UTF-8"?><records></records>');
            }
        }
    });
}

module.exports = { createXmlWriter };