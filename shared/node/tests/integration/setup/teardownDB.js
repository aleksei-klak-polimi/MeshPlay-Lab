import { execSync } from 'child_process';
import path from 'path';



export default async function teardownDB(verbose = true) {
    if(verbose) console.log('\n[JEST-SETUP] Tearing down Test database\n');
    const scriptPath = path.resolve(process.cwd(), '../db/scripts/entrypoints/drop_db_test.sh');

    try {
        if(verbose)
            execSync(`${scriptPath}`, {stdio: 'inherit'});
        else
            execSync(`${scriptPath}`);
        
        if(verbose) console.log('\n[JEST-SETUP] Test database cleared.\n');
    } catch (err) {
        console.error('\n[JEST-SETUP] Failed to tear down Test DB\n', err);
        process.exit(1);
    }
}