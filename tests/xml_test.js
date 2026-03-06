const http = require('http');
const BASE_URL = 'http://localhost:8080';

function createExportJob() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            format: "xml",
            columns: [
                { source: "id", target: "id" },
                { source: "name", target: "name" },
                { source: "value", target: "amount" },
                { source: "metadata", target: "meta" }
            ]
        });

        const req = http.request(
            `${BASE_URL}/exports`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(data)
                }
            },
            res => {
                let body = "";
                res.on("data", chunk => body += chunk);
                res.on("end", () => resolve(JSON.parse(body)));
            }
        );
        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    const job = await createExportJob();
    console.log("Export job:", job.exportId);
    let recordCount = 0;
    let totalBytes = 0;
    await new Promise((resolve, reject) => {
        http.get(`${BASE_URL}/exports/${job.exportId}/download`, res => {
            console.log("Content-Type:", res.headers["content-type"]);
            res.on("data", chunk => {
                const text = chunk.toString();
                totalBytes += chunk.length;
                const matches = text.match(/<record>/g);
                if (matches) recordCount += matches.length;
            });
            res.on("end", resolve);
            res.on("error", reject);
        });
    });

    console.log("\nRecords found:", recordCount.toLocaleString());
    console.log("File size:", (totalBytes / 1024 / 1024).toFixed(1), "MB");
}

main().catch(console.error);