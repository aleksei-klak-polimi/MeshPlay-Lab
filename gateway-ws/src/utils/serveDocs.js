import path from 'path';
import fs from 'fs';


function serveDoc(res, filepath) {

    const baseDir = path.resolve(process.cwd(), './doc/asyncapi/generated');

    // Normalize and construct file path
    const requested = filepath === "/" ? "/index.html" : filepath;
    const fullPath = path.resolve(baseDir, "." + requested);

    // Prevent path traversal
    if (!fullPath.startsWith(baseDir)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        return res.end("403 Forbidden");
    }

    //Check if file exists
    const stream = fs.createReadStream(fullPath);
    stream.on("error", () => {
        res.writeHead(404).end("404 Not Found");
    });
    stream.pipe(res);
}

export function serveDocs(req, res) {
    const filePath = function () {
        const parts = req.url.split('/').filter(Boolean);
        return "/" + parts.slice(1).join("/");
    }()

    serveDoc(res, filePath);
}


