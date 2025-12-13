import setupDB from '@meshplaylab/shared/tests/integration/setup/setupDB.js';
import loadEnv from '@meshplaylab/shared/src/utils/loadEnv.js';
import generateSchemas from './generateSchemas.js';

export default async function globalSetup(){
    loadEnv();
    await generateSchemas();
    setupDB();
}