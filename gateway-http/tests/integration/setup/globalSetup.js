import setupDB from '@meshplaylab/shared/tests/integration/setup/setupDB.js';
import loadEnv from '@meshplaylab/shared/src/utils/loadEnv.js';

export default function globalSetup(){
    loadEnv();
    setupDB();
}