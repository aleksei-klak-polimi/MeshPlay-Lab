// tests/unit/utils/response.test.js
import { successResponse, errorResponse } from '../../../src/utils/response.js';
import {expect, jest} from '@jest/globals';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('response.js', () => {
  test('successResponse sets status and json', () => {
    const res = mockRes();
    successResponse(res, 'ok', { user: 'alex' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'ok',
      data: { user: 'alex' },
    });
  });

  test('successResponse default output', () => {
    const res = mockRes();
    successResponse(res, 'ok');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'ok',
      data: null,
    });
  });

  test('successResponse should throw exception on missing args', () => {
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


  test('errorResponse builds correct shape', () => {
    const res = mockRes();
    errorResponse(res, 'Bad thing', 'SOME_CODE', 500, { field: 'name' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad thing',
      error: { code: 'SOME_CODE', details: { field: 'name' } },
    });
  });

  test('errorResponse default output', () => {
    const res = mockRes();
    errorResponse(res, 'Bad thing');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad thing',
      error: { code: 'GENERIC_ERROR', details: null },
    });
  });

  test('successResponse should throw exception on missing args', () => {
    const res = mockRes();

    expect(() => {
      successResponse(null, 'Bad thing');
    }).toThrow(TypeError);

    expect(() => {
      successResponse(res, null);
    }).toThrow(TypeError);

    expect(() => {
      successResponse(undefined, 'Bad thing');
    }).toThrow(TypeError);

    expect(() => {
      successResponse(res, undefined);
    }).toThrow(TypeError);

    expect(() => {
      successResponse();
    }).toThrow(TypeError);
  });
});
