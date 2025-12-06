import path from 'path';
import fs from 'fs';


export default function serveFile(req, res, baseDir){
    const filePath = getFilePath(req);
    serve(res, baseDir, filePath);
    return;
}

function serve(res, baseDir, filepath) {

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

function getFilePath(req) {
    const parts = req.url.split('/').filter(Boolean);
    return "/" + parts.slice(1).join("/");
}


