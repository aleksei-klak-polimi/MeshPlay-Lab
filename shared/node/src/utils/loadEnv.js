import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * Loads environment variables from a specified `.env` file.
 * If no file is specified, it will attempt to load from the file defined in `process.env.ENV_FILE`.
 * If no environment file is found or provided, it throws an error.
 *
 * @param {string|null} [envFile=null] - The name of the environment file to load (e.g., `.env.production`). 
 * If not provided, it will attempt to load the file from `process.env.ENV_FILE`.
 * 
 * @throws {Error} If no `envFile` is provided and `process.env.ENV_FILE` is not set.
 * @throws {Error} If the specified `envFile` does not exist in the expected directory.
 *
 * @example
 * loadEnv('.env.production');
 * loadEnv(); // Uses the file defined in process.env.ENV_FILE
 */
export default function loadEnv( envFile = null ){

    if(!envFile)
        envFile = process.env.ENV_FILE;
    
    if(!envFile)
        throw new Error('No env file was specified.');

    const envPath = path.resolve(process.cwd(), `./env/${envFile}`);

    // Check if file exists
    if(fs.existsSync(envPath)){
        dotenv.config({ path: envPath });
        console.log(`Loaded env variables from ${envFile}`);
    } else {
        throw new Error(`Could not find env file: ${envFile}`);
    }
}