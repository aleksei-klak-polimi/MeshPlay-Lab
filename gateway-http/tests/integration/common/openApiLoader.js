import fs from 'fs';
import path from 'path';
import pkg from 'jest-openapi'

export default function () {
    const jestOpenAPI = pkg.default;
    const pathToDoc = path.join(process.cwd(), 'doc/openapi/bundled.yaml');

    if (!fs.existsSync(pathToDoc))
        throw new Error(`OpenAPI file not found at: ${pathToDoc}`);

    jestOpenAPI(pathToDoc);
}