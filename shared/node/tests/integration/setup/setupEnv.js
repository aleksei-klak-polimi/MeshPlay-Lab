import path from 'path';
import dotenv from 'dotenv';

// Setup process.env to reference .env.test
export default function loadTestEnv(){
    const envPath = path.resolve(process.cwd(), './tests/.env.test');
    dotenv.config({ path: envPath });
}