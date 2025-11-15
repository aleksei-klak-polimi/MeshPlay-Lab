// tests/unit/utils/response.test.js
import { AppError, InternalError } from '../../../src/utils/errors.js';
import { successResponse, errorResponse } from '../../../src/utils/response.js';
import {expect, jest} from '@jest/globals';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('successResponse', () => {
  test('Sets status and json', () => {
    const res = mockRes();
    successResponse(res, 'ok', { user: 'alex' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'ok',
      data: { user: 'alex' },
    });
  });

  test('Default output', () => {
    const res = mockRes();
    successResponse(res, 'ok');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'ok',
      data: null,
    });
  });

  test('Throw exception on missing args', () => {
    const res = mockRes();

    expect(() => {
      successResponse(null, 'ok');
    }).toThrow(TypeError);

    expect(() => {
      successResponse(res, null);
    }).toThrow(TypeError);

    expect(() => {
      successResponse(undefined, 'ok');
    }).toThrow(TypeError);

    expect(() => {
      successResponse(res, undefined);
    }).toThrow(TypeError);

    expect(() => {
      successResponse();
    }).toThrow(TypeError);
  });
});



describe('errorResponse', () => {
  test('Builds correct shape', () => {
    const res = mockRes();
    const error = new InternalError( null, "INTERNAL_ERROR", 'name');

    errorResponse(res, error, 'name');

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: error.message,
      error: { code: error.code, details: ['name'] },
    });
  });

  test('Throws TypeError on non app errors', () => {
    const res = mockRes();
    const appError = new AppError();

    expect(() => {
      errorResponse(res, new Error());
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(res, new TypeError());
    }).toThrow(TypeError);
  });

  test('Throw exception on missing args', () => {
    const res = mockRes();
    const appError = new AppError();

    expect(() => {
      errorResponse(null, appError);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(res, null);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(undefined, appError);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse(res, undefined);
    }).toThrow(TypeError);

    expect(() => {
      errorResponse();
    }).toThrow(TypeError);
  });
});
