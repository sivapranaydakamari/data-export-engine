const { v4: uuidv4 } = require('uuid');

const jobs = new Map();

function createJob(format, columns, compression = null) {
    const exportId = uuidv4();
    const job = {
        exportId,
        format,
        columns,
        compression,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    jobs.set(exportId, job);
    return { exportId, status: job.status };
}

function getJob(exportId) {
    return jobs.get(exportId) || null;
}

function updateJobStatus(exportId, status) {
    const job = jobs.get(exportId);
    if (job) {
        job.status = status;
    }
}

module.exports = { createJob, getJob, updateJobStatus };