import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import config from '../../config/config.js';

const DB_TZ = config.dbTimezone;

/**
 * Converts a JavaScript Date object (or the current time if no date is provided) 
 * into a MySQL-compatible datetime string adjusted to the configured database timezone.
 * The returned string is in the format "yyyy-MM-dd HH:mm:ss".
 * 
 * @param {Date} [date=new Date()] - The JavaScript Date object to convert. Defaults to the current date and time if no argument is provided.
 * 
 * @returns {string} - A MySQL-compatible datetime string in the format "yyyy-MM-dd HH:mm:ss", adjusted for the DB timezone.
 */
export function toMySQLDateTime(date = new Date()) {
  const zoned = toZonedTime(date, DB_TZ);
  return format(zoned, 'yyyy-MM-dd HH:mm:ss', { timeZone: DB_TZ });
}

/**
 * Converts a MySQL DATETIME string (interpreted as being in the database timezone) 
 * into a JavaScript Date object in UTC.
 * If the input string is invalid or null, it will throw TypeError.
 *
 * @param {string} mysqlDateStr - A MySQL DATETIME string in the format "yyyy-MM-dd HH:mm:ss", interpreted as in the DB timezone.
 * 
 * @returns {Date|null} - A JavaScript Date object in UTC corresponding to the provided MySQL datetime string.
 * 
 * @throws {TypeError} if mysqlDateStr is missing or null.
 */
export function fromMySQLDateTime(mysqlDateStr) {
  if (!mysqlDateStr)
    throw new TypeError('fromMySQLDateTime expected a non null or non undefined argument');

  // Interpret this string as in DB timezone, convert to UTC.
  return fromZonedTime(mysqlDateStr, DB_TZ);
}