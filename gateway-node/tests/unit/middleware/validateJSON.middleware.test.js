import { jest, expect, describe, test, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.unstable_mockModule('../../../src/utils/response.js', () => ({ errorResponse: jest.fn() }));
jest.unstable_mockModule('../../../src/config/logger.js', () => ({
  createLogger: () => ({
    setRequestId: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
  }),
}));


// Import actual module after mocks
const { errorResponse } = await import('../../../src/utils/response.js');
const { BadRequestError } = await import('../../../src/utils/errors.js');
const { verifyJson, invalidJsonErrorHandler } = await import('../../../src/middleware/validateJSON.middleware.js');


// Helpers
const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const mockReq = () => ({
  meta : {id: 'TestingId'}
});

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});



// Test suite
describe('verifyJson middleware', () => {
  test('Parse valid JSON without throwing error', () => {
    const req = mockReq();
    const res = mockRes();

    const validBody = Buffer.from(JSON.stringify({ foo: 'bar' }));

    // Call the verify function defined in express.json({ verify })
    expect(() =>
      verifyJson(req, res, validBody)
    ).not.toThrow();
  });

  test('Throw error if invalid JSON is provided', () => {
    const req = mockReq();
    const res = mockRes();
    const invalidBody = Buffer.from('{"foo": invalid json}');

    expect(() => verifyJson(req, res, invalidBody)).toThrow(SyntaxError);
  });

  test('Mark error with isBodyParser = true when invalid JSON', () => {
    const req = mockReq();
    const res = mockRes();
    const invalidBody = Buffer.from('{"bad": json');

    try {
      verifyJson(req, res, invalidBody);
    } catch (err) {
      expect(err.isBodyParser).toBe(true);
    }
  });
});

describe('invalidJsonErrorHandler middleware', () => {
  test('Handle SyntaxError as invalid JSON', () => {
    const err = new SyntaxError('Unexpected token');
    const req = mockReq();
    const res = mockRes();

    invalidJsonErrorHandler(err, req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(BadRequestError)
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('Handle custom error with isBodyParser flag', () => {
    const err = { message: 'Invalid body', isBodyParser: true };
    const req = mockReq();
    const res = mockRes();

    invalidJsonErrorHandler(err, req, res, mockNext);

    expect(errorResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.any(BadRequestError)
    );
  });

  test('Call next() for non-body parser errors', () => {
    const err = new Error('Some other error');
    const req = mockReq();
    const res = mockRes();

    invalidJsonErrorHandler(err, req, res, mockNext);

    expect(errorResponse).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(err);
  });
});
