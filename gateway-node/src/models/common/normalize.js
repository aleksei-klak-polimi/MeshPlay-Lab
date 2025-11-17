/**
 * Converts all BigInt values in an object to strings.
 * Useful for safely serializing DB rows returned by MySQL/MariaDB.
 *
 * @param {Object|null|undefined} row - A single database row object.
 * 
 * @returns {Object|null|undefined} - A new object with BigInts converted to strings.
 */
export function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key] = typeof value === 'bigint' ? value.toString() : value;
  }
  return normalized;
}

/**
 * Applies normalizeRow() to an array of rows.
 *
 * @param {Array<Object>} rows - Array of database row objects.
 * @returns {Array<Object>} - Array of normalized row objects.
 */
export function normalizeRows(rows) {
  return rows.map(normalizeRow);
}
