import teardownDB from '@meshplaylab/shared/tests/integration/setup/teardownDB.js';

export default function globalTeardown(){
    teardownDB();
}