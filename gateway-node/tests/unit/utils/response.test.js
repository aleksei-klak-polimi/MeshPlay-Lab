// tests/unit/utils/response.test.js
import { AppError, InternalError } from '../../../src/utils/errors.js';
import { successResponse, errorResponse } from '../../../src/utils/response.js';
import {expect, jest} from '@jest/globals';

const mockReq = () => {
  const req = {};
  req.json = jest.fn().mockReturnValue(req);
  req.meta = {id: 'TestingId', timeStamp: 'Timestamp'};
  return req;
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('successResponse', () => {
  test('Sets status and json', () => {
    const res = mockRes();
    const req = mockReq();
    successResponse(req, res, 'ok', { user: 'alex' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'ok',
      data: { user: 'alex' },
      meta: {requestId: req.meta.id, timeStamp: req.meta.timeStamp}
    });
  });

  test('Default output', () => {
    const res = mockRes();
    const req = mockReq();
    successResponse(req, res, 'ok');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'ok',
      data: null,
      meta: {requestId: req.meta.id, timeStamp: req.meta.timeStamp}
    });
  });

  test('Throw exception on missing args', () => {
    const res = mockRes();
    const req = mockReq();

    expect(() => {
      successResponse(null, res, 'ok');
    }).toThrow(TypeError);

    expect(() => {
      successResponse(req, null, 'ok');
    }).toThrow(TypeError);

    expect(() => {
      successResponse(req, res, null);
    }).toThrow(TypeError);

    expect(() => {
      successResponse(undefined, res, 'ok');
    }).toThrow(TypeError);

    expect(() => {
      successResponse(req, undefined, 'ok');
    }).toThrow(TypeError);

    expect(() => {
      successResponse(req, res, undefined);
    }).toThrow(TypeError);

    expect(() => {
      successResponse();
    }).toThrow(TypeError);
  });
});



describe('errorResponse', () => {
  test('Builds correct shape', () => {
    const req = mockReq();
    const res = mockRes();
    const error = new InternalError( null, "INTERNAL_ERROR", 'name');

    errorResponse(req, res, error, 'name');

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: error.message,
      error: { code: error.code, details: ['name'] },
      meta: {requestId: req.meta.id, timeStamp: req.meta.timeStamp}
    });
  });

  test('Throws TypeError on non app errors', () => {
    const req = mockReq();
    const res = mockRes();
    const appError = new AppError();

    expect(() => {
      errorResponse(req, res, new Error());
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(req, res, new TypeError());
    }).toThrow(TypeError);
  });

  test('Throw exception on missing args', () => {
    const req = mockReq();
    const res = mockRes();
    const appError = new AppError();

    expect(() => {
      errorResponse(null, res, appError);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(req, null, appError);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(req, res, null);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(undefined, res, appError);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(req, undefined, appError);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(req, res, undefined);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse();
    }).toThrow(TypeError);
  });
});
