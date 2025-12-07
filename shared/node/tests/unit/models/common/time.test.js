import { toMySQLDateTime, fromMySQLDateTime } from '../../../../src/models/common/time.js';
import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import {expect, jest} from '@jest/globals';

jest.mock('../../../../src/config/config.js', () => ({
  __esModule: true,
  default: { dbTimezone: 'Europe/Paris' },
}));

describe('time.js', () => {
  const sampleDate = new Date('2025-11-10T00:00:00Z');

  test('toMySQLDateTime formats date in DB timezone', () => {
    const result = toMySQLDateTime(sampleDate);
    // Should produce string like "2025-11-10 01:00:00" for Paris (UTC+1)
    expect(result).toMatch(/2025-11-10 0[01]:00:00/);
  });

  test('fromMySQLDateTime returns Date object in UTC', () => {
    const mysqlStr = '2025-11-10 01:00:00';
    const result = fromMySQLDateTime(mysqlStr);
    expect(result).toBeInstanceOf(Date);
  });

  test('fromMySQLDateTime throws TypeError on null or undefined', () => {
    expect(() => {
      fromMySQLDateTime(null)
    }).toThrow(TypeError);

    expect(() => {
      fromMySQLDateTime(undefined)
    }).toThrow(TypeError);
  });

  test('toMySQLDateTime default value is timestamp of now in DB timezone', () => {
    const result = toMySQLDateTime();

    const dbNow = toMySQLDateTime(new Date());

    //Check that result and now are within 5 seconds of each other to account for test delays
    expect(Math.abs((new Date(result)) - (new Date(dbNow))) < 5000).toBe(true);
  })
});