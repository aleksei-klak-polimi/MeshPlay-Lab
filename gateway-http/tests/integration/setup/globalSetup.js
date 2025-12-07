import setupDB from '@meshplaylab/shared/tests/integration/setup/setupDB.js';
import setupEnv from '@meshplaylab/shared/tests/integration/setup/setupEnv.js';

export default function globalSetup(){
    setupEnv();
    console.log(`Should see test variable: ${process.env.TEST_FIELD}`);
    setupDB();
}