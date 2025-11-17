import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import setupDB from "./setupDB.js";

export default function globalSetup(){
    initializeTestEnviroment();
    setupDB();
}

// Setup process.env to reference .env.test
function initializeTestEnviroment(){
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../../.env.test');
    dotenv.config({ path: envPath });
}