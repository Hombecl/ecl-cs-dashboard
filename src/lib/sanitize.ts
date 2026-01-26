/**
 * Input sanitization utilities for Airtable queries
 * Prevents formula injection attacks
 */

/**
 * Escape single quotes for Airtable formula
 * Prevents formula injection by escaping special characters
 */
export function escapeAirtableValue(value: string | undefined | null): string {
  if (!value) return '';
  // Escape single quotes and backslashes
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valid case status values (whitelist)
 */
const VALID_STATUSES = ['New', 'In Progress', 'Pending Customer', 'Pending Internal', 'Replied', 'Resolved', 'Escalated'] as const;
export type CaseStatus = typeof VALID_STATUSES[number];

/**
 * Validate status value against whitelist
 */
export function isValidStatus(status: string): status is CaseStatus {
  return VALID_STATUSES.includes(status as CaseStatus);
}

/**
 * Validate and sanitize status - returns null if invalid
 */
export function sanitizeStatus(status: string | undefined | null): CaseStatus | null {
  if (!status) return null;
  if (isValidStatus(status)) return status;
  return null;
}

/**
 * Valid feedback status values
 */
const VALID_FEEDBACK_STATUSES = ['New', 'Reviewed', 'Actioned'] as const;
export type FeedbackStatus = typeof VALID_FEEDBACK_STATUSES[number];

/**
 * Validate feedback status
 */
export function isValidFeedbackStatus(status: string): status is FeedbackStatus {
  return VALID_FEEDBACK_STATUSES.includes(status as FeedbackStatus);
}

/**
 * Sanitize a generic string input
 * - Trims whitespace
 * - Limits length
 * - Removes null bytes
 */
export function sanitizeString(value: string | undefined | null, maxLength: number = 1000): string {
  if (!value || typeof value !== 'string') return '';
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/\0/g, ''); // Remove null bytes
}

/**
 * Validate that a value looks like an Airtable record ID
 * Airtable IDs start with 'rec' followed by alphanumeric characters
 */
export function isValidRecordId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^rec[a-zA-Z0-9]{14}$/.test(id);
}
