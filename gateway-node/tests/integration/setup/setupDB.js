import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Using absolute paths to avoid issues with working directories.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function setupDB(verbose = true) {
    if(verbose) console.log('\n[JEST-SETUP] Creating Test database\n');
    const scriptPath = path.resolve(__dirname, '../../../../db/scripts/entrypoints/create_db_test.sh');

    try {
        if(verbose)
            execSync(`${scriptPath}`, {stdio: 'inherit'});
        else
            execSync(`${scriptPath}`);
        
        if(verbose) console.log('\n[JEST-SETUP] Test database created.\n');
    } catch (err) {
        console.error('\n[JEST-SETUP] Failed to create Test DB\n', err);
        process.exit(1);
    }
}