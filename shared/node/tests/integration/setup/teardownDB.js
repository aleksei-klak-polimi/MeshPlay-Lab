import { execSync } from 'child_process';
import path from 'path';

export default async function teardownDB(verbose = true) {

    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;

    if(verbose) console.log('\n[JEST-SETUP] Tearing down Test database\n');
    const scriptPath = path.resolve(process.cwd(), '../db/scripts/env/test.sh');

    try {
        if(verbose)
            execSync(`${scriptPath} dropSchema ${dbHost} ${dbPort}`, {stdio: 'inherit'});
        else
            execSync(`${scriptPath} dropSchema ${dbHost} ${dbPort}`);
        
        if(verbose) console.log('\n[JEST-SETUP] Test database cleared.\n');
    } catch (err) {
        console.error('\n[JEST-SETUP] Failed to tear down Test DB\n', err);
        process.exit(1);
    }
}