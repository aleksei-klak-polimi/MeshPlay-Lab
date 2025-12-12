import { execSync } from 'child_process';
import path from 'path';



export default async function setupDB(verbose = true) {
    if(verbose) console.log('\n[JEST-SETUP] Creating Test database\n');
    const scriptPath = path.resolve(process.cwd(), '../db/scripts/env/test.sh');

    try {
        if(verbose)
            execSync(`${scriptPath} createSchema`, {stdio: 'inherit'});
        else
            execSync(`${scriptPath} createSchema`);
        
        if(verbose) console.log('\n[JEST-SETUP] Test database created.\n');
    } catch (err) {
        console.error('\n[JEST-SETUP] Failed to create Test DB\n', err);
        process.exit(1);
    }
}