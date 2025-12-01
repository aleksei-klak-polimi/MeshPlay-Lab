// Mock dependencies before src imports
import {expect, jest} from '@jest/globals';
import createLoggerMock from '../../mocks/config/logger.mock.js';
jest.unstable_mockModule('../../../src/config/logger.js', () => createLoggerMock() );
import UserModelMock from '../../mocks/models/user.model.mock.js';
jest.unstable_mockModule('../../../src/models/user.model.js', () => UserModelMock());
import dbMock from '../../mocks/config/db.mock.js';
jest.unstable_mockModule('../../../src/config/db.js', () => dbMock());
import jwtMock from '../../mocks/modules/jsonwebtoken.mock.js';
jest.unstable_mockModule('jsonwebtoken', () => jwtMock());




//Structure imports this way to ensure they happen after mocks.
const { validateJWT } = await import('../../../src/utils/validateJWT.js');
const {default: jwt} = await import('jsonwebtoken');
const {getConnection} = await import('../../../src/config/db.js');
const {default: UserModel} = await import('../../../src/models/user.model.js');


// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});


// Test suite
describe('validateJWT util function', () => {
  test('Throws TokenExpiredError if JWT expired', async () => {

    jwt.verify.mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    let error = null;
    const token = "valid.jwt.token";
    try{ await validateJWT(token, 'RequestID'); } 
    catch (err) { error = err; }
    expect(error).not.toBeNull;
    expect(error.name).toBe('TokenExpiredError');

  });

  test('Throws JsonWebTokenError if JWT is invalid', async () => {

    jwt.verify.mockImplementation(() => {
      const err = new Error('invalid signature');
      err.name = 'JsonWebTokenError';
      throw err;
    });

    let error = null;
    const token = "invalid.jwt.token";
    try{ await validateJWT(token, 'RequestID'); } 
    catch (err) { error = err; }
    expect(error).not.toBeNull;
    expect(error.name).toBe('JsonWebTokenError');

  });

  test('Throws InvalidTokenFormat if token schema invalid', async () => {

    jwt.verify.mockReturnValue({
      id: 1, // Missing fields like exp, iat, username
    });

    let error = null;
    const token = "invalid.jwt.token";
    try{ await validateJWT(token, 'RequestID'); } 
    catch (err) { error = err; }
    expect(error).not.toBeNull;
    expect(error.name).toBe('InvalidTokenFormat');

  });

  test('Throws UserNotFound if user not found in DB', async () => {
    const fakeConn = { release: jest.fn() };

    jwt.verify.mockReturnValue({
      id: 1,
      username: 'bob',
      exp: 123456,
      iat: 12345,
    });

    getConnection.mockResolvedValue(fakeConn);
    UserModel.getById.mockResolvedValue(null);

    let error = null;
    const token = "valid.jwt.token";
    try{ await validateJWT(token, 'RequestID'); }
    catch (err) { error = err; }
    expect(error).not.toBeNull;
    expect(error.name).toBe('UserNotFound');

    expect(fakeConn.release).toHaveBeenCalled();
  });

  test('Throws UsernamesDontMatch if username mismatch', async () => {
    const fakeConn = { release: jest.fn() };

    jwt.verify.mockReturnValue({
      id: 1,
      username: 'alice',
      exp: 123456,
      iat: 12345,
    });

    getConnection.mockResolvedValue(fakeConn);
    UserModel.getById.mockResolvedValue({ id: 1, username: 'bob' });

    let error = null;
    const token = "valid.jwt.token";
    try{ await validateJWT(token, 'RequestID'); }
    catch (err) { error = err; }
    expect(error).not.toBeNull;
    expect(error.name).toBe('UsernamesDontMatch');

    expect(fakeConn.release).toHaveBeenCalled();
  });

  test('Handles DB connection error gracefully', async () => {
    jwt.verify.mockReturnValue({
      id: 1,
      username: 'bob',
      exp: 123456,
      iat: 12345,
    });

    getConnection.mockRejectedValue(new Error('DB down'));

    let error = null;
    const token = "valid.jwt.token";
    try{ await validateJWT(token, 'RequestID'); }
    catch (err) { error = err; }
    expect(error).not.toBeNull;
    expect(error.message).toBe('DB down');
  });

  test('Returns decrypted token if everything is valid', async () => {
    const fakeConn = { release: jest.fn() };

    const expectedToken = {
        id: 1,
        username: 'bob',
        exp: 123456,
        iat: 12345,
    };

    jwt.verify.mockReturnValue( expectedToken );

    getConnection.mockResolvedValue(fakeConn);
    UserModel.getById.mockResolvedValue({ id: 1, username: 'bob' });

    const token = await validateJWT('valid.jwt.token', 'RequestID');

    expect(token).toBe( expectedToken );
    expect(fakeConn.release).toHaveBeenCalled();
  });

  test('Handles missing RequestID', async () => {
    const fakeConn = { release: jest.fn() };

    const expectedToken = {
        id: 1,
        username: 'bob',
        exp: 123456,
        iat: 12345,
    };

    jwt.verify.mockReturnValue( expectedToken );

    getConnection.mockResolvedValue(fakeConn);
    UserModel.getById.mockResolvedValue({ id: 1, username: 'bob' });

    const token = await validateJWT('valid.jwt.token');

    expect(token).toBe( expectedToken );
    expect(fakeConn.release).toHaveBeenCalled();
  });

});
