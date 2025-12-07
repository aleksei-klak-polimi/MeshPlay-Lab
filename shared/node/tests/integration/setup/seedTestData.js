import { execSync } from 'child_process';
import path from 'path';



export default async function seedDB(verbose = true) {
    if(verbose) console.log('\n[JEST-SETUP] Seeding Test database\n');
    const scriptPath = path.resolve(process.cwd(), '../db/scripts/entrypoints/seed_db_test.sh');

    try {
        if(verbose)
            execSync(`${scriptPath}`, {stdio: 'inherit'});
        else
            execSync(`${scriptPath}`);

        if(verbose) console.log('\n[JEST-SETUP] Test database seeded.\n');
    } catch (err) {
        console.error('\n[JEST-SETUP] Failed to seed Test DB\n', err);
        process.exit(1);
    }
}