import request from 'supertest';
import { getConnection, pool } from '@meshplaylab/shared/src/config/db.js';
import app from '../../src/app.js';
import jestOpenAPI from './common/openApiLoader.js';

import setupDB from '@meshplaylab/shared/tests/integration/setup/setupDB.js';
import teardownDB from '@meshplaylab/shared/tests/integration/setup/teardownDB.js';
import { afterAll, afterEach, beforeAll, beforeEach, expect } from '@jest/globals';


let connection;

// Load OpenAPI validators
beforeAll( () => {
    jestOpenAPI();
});

beforeEach(async () => {
    await setupDB(false);
    connection = await getConnection();
});

afterEach(async () => {
    await teardownDB(false);
    if (connection) connection.release();
});

afterAll(async () => {
    //To avoid jest getting stuck on exit
    await pool.end();
});

/**
 * Utility to create a user for login tests
 */
const createTestUser = async (username = 'login_user', password = 'Passw0rd!') => {
    const res = await request(app)
        .post('/api/auth/signup')
        .send({ username, password })
        .expect(201);

    return res.body.data;
};

/**
 * Utility to check that the User table is empty.
 */
const expectNoUsersInDB = async () => {
    const rows = await connection.query('SELECT COUNT(*) as count FROM User');
    expect(rows[0].count).toBe(0n);
};



describe('Integration Tests for /auth paths', () => {

    describe('Integration Test for /auth/signup', () => {

        test('Performs signup correctly', async () => {
            let res;
            let userId;

            res = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'init_test_user',
                    password: 'Passw0rd!',
                })
                //Returns correct response status
                .expect(201);

            //Formats response body correctly
            expect(res).toSatisfyApiSpec();

            userId = res.body.data.id;


            //Correctly adds new user to the database
            const insertedUserRow = await connection.query('SELECT * FROM User WHERE id = ?', [userId]);

            //Check that user exists
            expect(insertedUserRow[0]).toBeTruthy();

            //Check that user has correct username
            expect(insertedUserRow[0].username).toMatch('init_test_user');

            //Check that server did not create more than 1 user
            const rows = await connection.query('SELECT COUNT(*) as count FROM User');
            expect(rows[0].count).toBe(1n);
        });

        test('Handles username conflict on signup correctly', async () => {
            await request(app)
                .post('/api/auth/signup')
                .send({ username: 'dupe_user', password: 'Passw0rd!' })
                .expect(201);

            const res = await request(app)
                .post('/api/auth/signup')
                .send({ username: 'dupe_user', password: 'Passw0rd!' })
                .expect(409); // assuming you return conflict for duplicate users

            expect(res).toSatisfyApiSpec();

            const rows = await connection.query('SELECT COUNT(*) as count FROM User');
            expect(rows[0].count).toBe(1n);
        });

        test('Handles missing username', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({ password: 'Passw0rd!' })
                .expect(422);

            expect(res).toSatisfyApiSpec();

            await expectNoUsersInDB();
        });

        test('Handles missing password', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({ username: 'no_password_user' })
                .expect(422);

            expect(res).toSatisfyApiSpec();

            await expectNoUsersInDB();
        });

        test('Handles empty body', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({})
                .expect(422);

            expect(res).toSatisfyApiSpec();

            await expectNoUsersInDB();
        });

        test('Handles malformed JSON', async () => {
            // supertest `.send()` automatically stringifies JSON,
            // so for malformed input we must manually send invalid JSON via .set() and .send()
            const res = await request(app)
                .post('/api/auth/signup')
                .set('Content-Type', 'application/json')
                .send('{"username": "bad_json_user", "password": ') // ← malformed JSON
                .expect(400);

            expect(res).toSatisfyApiSpec();

            await expectNoUsersInDB();
        });
    });

    describe('Integration Test for /auth/login', () => {


        test('Logs in successfully with valid credentials', async () => {
            const user = await createTestUser('good_login_user', 'Passw0rd!');

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'good_login_user', password: 'Passw0rd!' })
                .expect(200);

            expect(res).toSatisfyApiSpec();
            expect(res.body.data.token).toBeDefined();
            expect(typeof res.body.data.token).toBe('string');
        });

        test('Rejects invalid username', async () => {
            await createTestUser('known_user', 'Passw0rd!');

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'unknown_user', password: 'Passw0rd!' })
                .expect(401);

            expect(res).toSatisfyApiSpec();
        });

        test('Rejects wrong password', async () => {
            await createTestUser('user_wrong_pw', 'Passw0rd!');

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'user_wrong_pw', password: 'WRONG_Passw0rd!' })
                .expect(401);

            expect(res).toSatisfyApiSpec();
        });

        test('Handles missing username', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ password: 'Passw0rd!' })
                .expect(422);

            expect(res).toSatisfyApiSpec();
        });

        test('Handles missing password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'example_user' })
                .expect(422);

            expect(res).toSatisfyApiSpec();
        });

        test('Handles empty body', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(422);

            expect(res).toSatisfyApiSpec();
        });

        test('Handles malformed JSON', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('{"username": "a", "password": ')
                .expect(400);

            expect(res).toSatisfyApiSpec();
        });
    });

});

