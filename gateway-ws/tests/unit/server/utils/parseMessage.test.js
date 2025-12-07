import { jest, expect, describe, test, beforeEach } from '@jest/globals';

// Mocks
import createLoggerMock from '@meshplaylab/shared/tests/mocks/config/logger.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());

// Import after mocks
const { default: parse } = await import('../../../../src/server/utils/parseMessage.js');
const { InvalidMessageFormat } = await import('../../../../src/constants/errors.js');



beforeEach(() => {
  jest.clearAllMocks();
});



// Test Suite
describe('parseMessage.parse', () => {
  const meta = { requestId: 'xyz' };

  test('Parses valid JSON messages', () => {
    const raw = '{"hello":"world"}';

    const result = parse(raw, meta);

    expect(result).toEqual({ hello: 'world' });
  });

  test('Throws InvalidMessageFormat when JSON is invalid', () => {
    const raw = '{"invalid JSON"';

    let thrown = null;
    try { parse(raw, meta); }
    catch (e) { thrown = e; }

    expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    expect(thrown.message).toBe('Invalid JSON format in the request.');
  });

});
