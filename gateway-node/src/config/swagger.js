import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const openapiFile = join(__dirname, '../../doc/openapi/bundled.yaml');
export const swaggerSpec = yaml.load(fs.readFileSync(openapiFile, 'utf8'));
