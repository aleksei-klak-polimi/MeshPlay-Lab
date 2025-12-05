import setupDB from '@meshplaylab/shared/tests/integration/setup/setupDB.js';
import setupEnv from '@meshplaylab/shared/tests/integration/setup/setupEnv.js';
import generateSchemas from './generateSchemas.js';

export default async function globalSetup(){
    setupEnv();
    await generateSchemas();
    console.log(`Should see test variable: ${process.env.TEST_FIELD}`);
    setupDB();
}