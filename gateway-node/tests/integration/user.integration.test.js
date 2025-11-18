import request from 'supertest';
import { getConnection, pool } from '@meshplaylab/shared/src/config/db.js';
import app from '../../src/app.js';
import jestOpenAPI from './common/openApiLoader.js';

import setupDB from './setup/setupDB.js';
import teardownDB from './setup/teardownDB.js';
import { afterAll, afterEach, beforeAll, beforeEach, expect } from '@jest/globals';


let connection;

// Load OpenAPI validators
beforeAll(() => {
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
 * Utility: create a user and return { id, token }
 */
const createAuthenticatedUser = async (username = 'userA', password = 'Passw0rd!') => {
    const signup = await request(app)
        .post('/api/auth/signup')
        .send({ username, password })
        .expect(201);

    const login = await request(app)
        .post('/api/auth/login')
        .send({ username, password })
        .expect(200);

    return {
        id: signup.body.data.id,
        token: login.body.data.token,
    };
};

/**
 * Utility: get number of rows in User
 */
const countUsers = async () => {
    const rows = await connection.query(`SELECT COUNT(*) AS count FROM User`);
    return rows[0].count;
};

/**
 * Utility: fetch raw user row
 */
const getUserRow = async (id) => {
    const rows = await connection.query(`SELECT * FROM User WHERE id = ?`, [id]);
    return rows[0] || null;
};


describe('Integration Tests for /api/user/:id', () => {

    describe('GET /api/user/:id', () => {

        test('Successfully retrieves a user with valid token & valid id', async () => {
            const { id, token } = await createAuthenticatedUser('getUser', 'Passw0rd!');

            const res = await request(app)
                .get(`/api/user/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res).toSatisfyApiSpec();
            expect(res.body.data.id).toBe(id);
            expect(res.body.data.username).toBe('getUser');
        });

        test('Rejects request with missing token', async () => {
            const { id } = await createAuthenticatedUser('missingToken');

            const res = await request(app)
                .get(`/api/user/${id}`)
                .expect(401);

            expect(res).toSatisfyApiSpec();
        });

        test('Rejects request with malformed id', async () => {
            const { token } = await createAuthenticatedUser();

            const res = await request(app)
                .get(`/api/user/not-a-number`)
                .set('Authorization', `Bearer ${token}`)
                .expect(422);

            expect(res).toSatisfyApiSpec();
        });

        test('Returns 404 for non-existent user', async () => {
            const { token } = await createAuthenticatedUser();

            const res = await request(app)
                .get(`/api/user/99999`)
                .set('Authorization', `Bearer ${token}`)
                .expect(404);

            expect(res).toSatisfyApiSpec();
        });
    });


    describe('DELETE /api/user/:id', () => {

        test('User can delete themselves (204) and DB is updated correctly', async () => {
            const { id, token } = await createAuthenticatedUser('selfdelete');

            const initialCount = await countUsers();

            await request(app)
                .delete(`/api/user/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(204);

            expect(await countUsers()).toBe(initialCount - 1n);
            expect(await getUserRow(id)).toBe(null);
        });

        test('User cannot delete another user (403)', async () => {
            const userA = await createAuthenticatedUser('userA');
            const userB = await createAuthenticatedUser('userB');

            const initialCount = await countUsers();

            const res = await request(app)
                .delete(`/api/user/${userB.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .expect(403);

            expect(res).toSatisfyApiSpec();

            // DB unchanged
            expect(await countUsers()).toBe(initialCount);
            expect(await getUserRow(userA.id)).not.toBe(null);
            expect(await getUserRow(userB.id)).not.toBe(null);
        });

        test('Rejects delete with missing token', async () => {
            const { id } = await createAuthenticatedUser('deleteMissingToken');

            const initialCount = await countUsers();

            const res = await request(app)
                .delete(`/api/user/${id}`)
                .expect(401);

            expect(res).toSatisfyApiSpec();

            // DB unchanged
            expect(await countUsers()).toBe(initialCount);
            expect(await getUserRow(id)).not.toBe(null);
        });

        test('Rejects delete for malformed id', async () => {
            const { id, token } = await createAuthenticatedUser();

            const initialCount = await countUsers();

            const res = await request(app)
                .delete('/api/user/abc123')
                .set('Authorization', `Bearer ${token}`)
                .expect(422);

            expect(res).toSatisfyApiSpec();

            // DB unchanged
            expect(await countUsers()).toBe(initialCount);
            expect(await getUserRow(id)).not.toBe(null);
        });
    });


    describe('PATCH /api/user/:id', () => {

        test('User can update their own username', async () => {
            const { id, token } = await createAuthenticatedUser('patchUser');

            const res = await request(app)
                .patch(`/api/user/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ username: 'patchedName' })
                .expect(200);

            expect(res).toSatisfyApiSpec();
            expect(res.body.data.username).toBe('patchedName');

            const row = await getUserRow(id);
            expect(row.username).toBe('patchedName');
        });

        test('User can update their own password (200)', async () => {
            const { id, token } = await createAuthenticatedUser('patchPw');

            const res = await request(app)
                .patch(`/api/user/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ password: 'NewPassw0rd!' })
                .expect(200);

            expect(res).toSatisfyApiSpec();

            //Check that new password actually works and old password does not work anymore
            await request(app)
                .post('/api/auth/login')
                .send({ password: 'Passw0rd!', username: 'patchPw' })
                .expect(401);

            await request(app)
                .post('/api/auth/login')
                .send({ password: 'NewPassw0rd!', username: 'patchPw' })
                .expect(200);
        });

        test('User cannot edit another user (403)', async () => {
            const userA = await createAuthenticatedUser('patchA');
            const userB = await createAuthenticatedUser('patchB');

            const initialRowB = await getUserRow(userB.id);

            const res = await request(app)
                .patch(`/api/user/${userB.id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .send({ username: 'HackedName' })
                .expect(403);

            expect(res).toSatisfyApiSpec();

            // verify user B unchanged
            const updatedRowB = await getUserRow(userB.id);
            expect(updatedRowB.username).toBe(initialRowB.username);
        });

        test('Rejects patch with missing token', async () => {
            const { id } = await createAuthenticatedUser('patchMissingToken');

            const res = await request(app)
                .patch(`/api/user/${id}`)
                .send({ username: 'nope' })
                .expect(401);

            expect(res).toSatisfyApiSpec();

            // verify username is unchanged
            const updatedRowB = await getUserRow(id);
            expect(updatedRowB.username).toBe('patchMissingToken');

            // verify password is unchanged
            await request(app)
                .post('/api/auth/login')
                .send({ password: 'Passw0rd!', username: 'patchMissingToken' })
                .expect(200);
        });

        test('Rejects malformed id', async () => {
            const { id, token } = await createAuthenticatedUser('userA');

            const res = await request(app)
                .patch('/api/user/not-a-number')
                .set('Authorization', `Bearer ${token}`)
                .send({ username: 'userA' })
                .expect(422);

            expect(res).toSatisfyApiSpec();

            // verify username is unchanged
            const updatedRowB = await getUserRow(id);
            expect(updatedRowB.username).toBe('userA');

            // verify password is unchanged
            await request(app)
                .post('/api/auth/login')
                .send({ password: 'Passw0rd!', username: 'userA' })
                .expect(200);
        });

        test('Rejects empty body (400)', async () => {
            const { id, token } = await createAuthenticatedUser('userA');

            const res = await request(app)
                .patch(`/api/user/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(400);

            expect(res).toSatisfyApiSpec();

            // verify username is unchanged
            const updatedRowB = await getUserRow(id);
            expect(updatedRowB.username).toBe('userA');

            // verify password is unchanged
            await request(app)
                .post('/api/auth/login')
                .send({ password: 'Passw0rd!', username: 'userA' })
                .expect(200);
        });

        test('Handles malformed JSON body (400)', async () => {
            const { id, token } = await createAuthenticatedUser('malformedPatch');

            const res = await request(app)
                .patch(`/api/user/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json')
                .send('{"username": ') // malformed JSON
                .expect(400);

            expect(res).toSatisfyApiSpec();

            // verify username is unchanged
            const updatedRowB = await getUserRow(id);
            expect(updatedRowB.username).toBe('malformedPatch');

            // verify password is unchanged
            await request(app)
                .post('/api/auth/login')
                .send({ password: 'Passw0rd!', username: 'malformedPatch' })
                .expect(200);
        });
    });

});
