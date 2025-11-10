import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import config from '../config/config.js';

const DB_TZ = config.dbTimezone;

/**
 * Converts a JS Date (or now) into a MySQL-compatible datetime string
 * adjusted for DB timezone.
 * e.g. "2025-11-09 22:45:12"
 */
export function toMySQLDateTime(date = new Date()) {
  const zoned = toZonedTime(date, DB_TZ);
  return format(zoned, 'yyyy-MM-dd HH:mm:ss', { timeZone: DB_TZ });
}

/**
 * Converts a MySQL DATETIME string (interpreted as DB timezone)
 * into a JS Date object in UTC.
 */
export function fromMySQLDateTime(mysqlDateStr) {
  if (!mysqlDateStr) return null;
  // Interpret this string as in DB timezone, convert to UTC.
  return fromZonedTime(mysqlDateStr, DB_TZ);
}