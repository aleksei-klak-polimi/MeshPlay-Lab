export function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key] = typeof value === 'bigint' ? value.toString() : value;
  }
  return normalized;
}

export function normalizeRows(rows) {
  return rows.map(normalizeRow);
}
