import {expect, jest} from '@jest/globals';
import { BadRequestError, UnauthorizedError } from '../../../src/utils/errors.js';

// Mock dependencies before imports
import createLoggerMock from '@meshplaylab/shared/tests/mocks/config/logger.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());
import responseMock from '../../mocks/utils/response.mock.js';
jest.unstable_mockModule('../../../src/utils/response.js', () => responseMock());
import errorHandMock from '../../mocks/utils/errorHanlder.mock.js';
jest.unstable_mockModule('../../../src/utils/errorHandler.js', () => errorHandMock());
import validateJWTMock from '@meshplaylab/shared/tests/mocks/utils/validateJWT.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/utils/validateJWT.js', () => validateJWTMock());




//Structure imports this way to ensure they happen after mocks.
const { errorResponse } = await import('../../../src/utils/response.js');
const { handleError } = await import('../../../src/utils/errorHandler.js');
const { authenticateToken } = await import('../../../src/middleware/auth.middleware.js');
const { validateJWT } = await import('@meshplaylab/shared/src/utils/validateJWT.js');



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

    validateJWT.mockImplementation(() => {
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

    validateJWT.mockImplementation(() => {
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

    validateJWT.mockImplementation(() => {
      const err = new Error('invalid signature');
      err.name = 'InvalidTokenFormat';
      throw err;
    });

    await authenticateToken(req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(BadRequestError)
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Returns 401 if user not found in DB', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer good.jwt' };
    const res = mockRes();

    validateJWT.mockImplementation(() => {
      const err = new Error('invalid signature');
      err.name = 'UserNotFound';
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

  test('Returns 401 if username mismatch', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer good.jwt' };
    const res = mockRes();

    validateJWT.mockImplementation(() => {
      const err = new Error('invalid signature');
      err.name = 'UsernamesDontMatch';
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

  test('Handles DB connection error gracefully', async () => {
    const req = mockReq();
    req.headers = { authorization: 'Bearer good.jwt' };
    const res = mockRes();

    validateJWT.mockImplementation(() => {
      throw new Error('DB down');
    });

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

    validateJWT.mockReturnValue({
      id: 1,
      username: 'bob',
      exp: 123456,
      iat: 12345,
    });

    await authenticateToken(req, res, mockNext);

    expect(req.user).toEqual(expect.objectContaining({ id: 1, username: 'bob' }));
    expect(mockNext).toHaveBeenCalled();
  });

});
