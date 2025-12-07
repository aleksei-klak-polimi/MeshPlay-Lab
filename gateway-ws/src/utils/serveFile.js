import path from 'path';
import fs from 'fs';

/**
 * Serves a static file from a specified base directory.
 *
 * Extracts the requested file path from the HTTP request, resolves it
 * relative to the provided `baseDir`, applies path-traversal protection,
 * and streams the file to the client.
 *
 * Intended for serving static files such as:
 * - HTML
 * - CSS/JS bundles
 * - Images or other assets
 *
 * @param {import('http').IncomingMessage} req - Incoming HTTP request.
 * @param {import('http').ServerResponse} res - HTTP response object used to write the file contents.
 * @param {string} baseDir - Base directory from which files are served. Must be an absolute path.
 *
 * @returns {void}
 */
export default function serveFile(req, res, baseDir){
    const filePath = getFilePath(req);
    serve(res, baseDir, filePath);
    return;
}

/**
 * Streams the requested file to the HTTP response, applying:
 * - Directory resolution relative to the provided baseDir
 * - Path traversal protection (`../` attacks)
 * - Automatic 404 if the file does not exist
 *
 * @param {import('http').ServerResponse} res - HTTP response used to deliver the file.
 * @param {string} baseDir - Absolute base directory to serve files from.
 * @param {string} filepath - Normalized file path beginning with `/` (e.g., "/index.html").
 *
 * @returns {void}
 */
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

/**
 * Extracts and normalizes the requested file path from the HTTP request URL.
 *
 * Converts URLs like:
 * - `/docs` -> `/` (handled as `/index.html`)
 * - `/docs/assets/main.css` -> `/assets/main.css`
 *
 * @param {import('http').IncomingMessage} req - HTTP request containing the URL.
 * @returns {string} Normalized path starting with `/`.
 */
function getFilePath(req) {
    const parts = req.url.split('/').filter(Boolean);
    return "/" + parts.slice(1).join("/");
}


