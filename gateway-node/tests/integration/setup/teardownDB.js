import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Using absolute paths to avoid issues with working directories.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function teardownDB() {
    console.log('\n[JEST-SETUP] Tearing down Test database\n');
    const scriptPath = path.resolve(__dirname, '../../../../db/scripts/entrypoints/drop_db_test.sh');

    try {
        execSync(`${scriptPath}`, {stdio: 'inherit'});
        console.log('\n[JEST-SETUP] Test database cleared.\n');
    } catch (err) {
        console.error('\n[JEST-SETUP] Failed to tear down Test DB\n', err);
        process.exit(1);
    }
}