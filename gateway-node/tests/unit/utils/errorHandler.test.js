// tests/unit/utils/errorHandler.test.js
import { handleError } from '../../../src/utils/errorHandler.js';
import { AppError, UnauthorizedError, NotFoundError, InternalError } from '../../../src/utils/errors.js';
import {expect, jest} from '@jest/globals';

describe('errorHandler', () => {

  test('handles AppError correctly', () => {
    let result;
    
    result= handleError(new AppError('Bad thing.'));

    expect(result).toBeInstanceOf(AppError);

    result= handleError(new UnauthorizedError('Bad thing 2.'));

    expect(result).toBeInstanceOf(UnauthorizedError);

    result= handleError(new NotFoundError());

    expect(result).toBeInstanceOf(NotFoundError);

  });

  test('handles generic Error as internal', () => {

    let result;
    
    result= handleError(new Error('Bad thing.'));

    expect(result).toBeInstanceOf(InternalError);

    result= handleError(new TypeError('Bad thing 2.'));

    expect(result).toBeInstanceOf(InternalError);

  });

  test('throws TypeError on null or undefined arg', () => {

    expect(() => {
      handleError(null);
    }).toThrow(TypeError);

    expect(() => {
      handleError(undefined);
    }).toThrow(TypeError);

  });
});
