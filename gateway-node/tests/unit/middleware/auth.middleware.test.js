// Mock dependencies before imports
jest.unstable_mockModule('../../../src/utils/response.js', () => ({ errorResponse: jest.fn() }));
jest.unstable_mockModule('../../../src/utils/errorHandler.js', () => ({ handleError: jest.fn(() => {return {status: 500}}) }));
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => ({
  createLogger: () => ({
    setRequestId: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
  }),
}));
jest.unstable_mockModule('../../../src/config/db.js', () => ({ getConnection: jest.fn() }));
jest.unstable_mockModule('jsonwebtoken', () => ({ default: { verify: jest.fn() } }));
jest.unstable_mockModule('../../../src/models/user.model.js', () => ({ default: { getById: jest.fn() } }));

//Structure imports this way to ensure they happen after mocks.
const { errorResponse } = await import('../../../src/utils/response.js');
const { handleError } = await import('../../../src/utils/errorHandler.js');
const { authenticateToken } = await import('../../../src/middleware/auth.middleware.js');
const {default: jwt} = await import('jsonwebtoken');
const {getConnection} = await import('../../../src/config/db.js');
const {default: UserModel} = await import('../../../src/models/user.model.js');

import {expect, jest} from '@jest/globals';
import { BadRequestError, UnauthorizedError } from '../../../src/utils/errors.js';



// Helpers
const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const mockReq = () => ({
  meta : {id: 'TestingId'}
});

const mockNext = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});




// Test suite
describe('authenticateToken middleware', () => {
  test('Returns 401 if Authorization header is missing', async () => {
    const req = mockReq();
    req.headers = {};
    const res = mockRes();

    await authenticateToken(req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
        req,
        res,
        expect.any(UnauthorizedError)
    );

    expect(mockNext).not.toHaveBeenCalled();
  });


  test('Returns 401 if token part is missing', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer' };
    const res = mockRes();

    await authenticateToken(req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(UnauthorizedError)
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Returns 401 if JWT expired', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer valid.jwt.token' };
    const res = mockRes();

    jwt.verify.mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    await authenticateToken(req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(UnauthorizedError)
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Returns 401 if JWT is invalid', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer invalid.jwt' };
    const res = mockRes();

    jwt.verify.mockImplementation(() => {
      const err = new Error('invalid signature');
      err.name = 'JsonWebTokenError';
      throw err;
    });

    await authenticateToken(req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(UnauthorizedError)
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Returns 400 if token schema invalid', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer good.jwt' };
    const res = mockRes();

    jwt.verify.mockReturnValue({
      id: 1, // Missing fields like exp, iat, username
    });

    await authenticateToken(req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(BadRequestError)
    );
  });

  test('Returns 401 if user not found in DB', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer good.jwt' };
    const res = mockRes();
    const fakeConn = { release: jest.fn() };

    jwt.verify.mockReturnValue({
      id: 1,
      username: 'bob',
      exp: 123456,
      iat: 12345,
    });

    getConnection.mockResolvedValue(fakeConn);
    UserModel.getById.mockResolvedValue(null);

    await authenticateToken(req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(UnauthorizedError)
    );
    expect(fakeConn.release).toHaveBeenCalled();
  });

  test('Returns 401 if username mismatch', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer good.jwt' };
    const res = mockRes();
    const fakeConn = { release: jest.fn() };

    jwt.verify.mockReturnValue({
      id: 1,
      username: 'alice',
      exp: 123456,
      iat: 12345,
    });

    getConnection.mockResolvedValue(fakeConn);
    UserModel.getById.mockResolvedValue({ id: 1, username: 'bob' });

    await authenticateToken(req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(UnauthorizedError)
    );
    expect(fakeConn.release).toHaveBeenCalled();
  });

  test('Handles DB connection error gracefully', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer good.jwt' };
    const res = mockRes();

    jwt.verify.mockReturnValue({
      id: 1,
      username: 'bob',
      exp: 123456,
      iat: 12345,
    });

    getConnection.mockRejectedValue(new Error('DB down'));

    await authenticateToken(req, res, mockNext);

    expect(handleError).toHaveBeenCalled();
    expect(errorResponse).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Calls next() and sets req.user if everything is valid', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer good.jwt' };
    const res = mockRes();
    const fakeConn = { release: jest.fn() };

    jwt.verify.mockReturnValue({
      id: 1,
      username: 'bob',
      exp: 123456,
      iat: 12345,
    });

    getConnection.mockResolvedValue(fakeConn);
    UserModel.getById.mockResolvedValue({ id: 1, username: 'bob' });

    await authenticateToken(req, res, mockNext);

    expect(req.user).toEqual(expect.objectContaining({ id: 1, username: 'bob' }));
    expect(mockNext).toHaveBeenCalled();
  });

});
