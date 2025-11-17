import { describe, test, expect } from '@jest/globals';
import { normalizeRow, normalizeRows } from '../../../../src/models/common/normalize.js';

describe('normalizeRow', () => {
  test('Converts bigint fields to strings', () => {
    const input = { id: 123n, name: 'Alice' };
    const output = normalizeRow(input);

    expect(output.id).toBe('123');
    expect(typeof output.id).toBe('string');
    expect(output.name).toBe('Alice');
  });

  test('Returns same object if no bigints present', () => {
    const input = { id: 1, name: 'Bob' };
    const output = normalizeRow(input);

    expect(output).toEqual(input);
  });

  test('Returns null when input is null', () => {
    expect(normalizeRow(null)).toBeNull();
  });

  test('Returns input unchanged when input is non-object', () => {
    expect(normalizeRow('foo')).toBe('foo');
    expect(normalizeRow(123)).toBe(123);
  });
});

describe('normalizeRows', () => {
  test('Applies normalizeRow to all rows', () => {
    const input = [
      { id: 1n, name: 'A' },
      { id: 2n, name: 'B' },
    ];

    const output = normalizeRows(input);

    expect(output).toEqual([
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ]);
  });

  test('should return empty array if input is empty', () => {
    expect(normalizeRows([])).toEqual([]);
  });
});
