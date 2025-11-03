import { Timestamp } from 'firebase/firestore';

/**
 * Utility functions for working with Firebase Timestamps
 */

/**
 * Convert Firebase Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | undefined | null): Date | null {
  if (!timestamp) return null;
  return timestamp.toDate();
}

/**
 * Convert Date to Firebase Timestamp
 */
export function dateToTimestamp(date: Date | undefined | null): Timestamp | null {
  if (!date) return null;
  return Timestamp.fromDate(date);
}

/**
 * Create Timestamp from current time
 */
export function nowTimestamp(): Timestamp {
  return Timestamp.now();
}

/**
 * Convert Firebase Timestamp to milliseconds
 */
export function timestampToMillis(timestamp: Timestamp | undefined | null): number {
  if (!timestamp) return 0;
  return timestamp.toMillis();
}

/**
 * Format Firebase Timestamp as locale date string
 */
export function formatTimestampDate(timestamp: Timestamp | undefined | null, locale?: string): string {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleDateString(locale);
}

/**
 * Format Firebase Timestamp as locale time string
 */
export function formatTimestampTime(timestamp: Timestamp | undefined | null, locale?: string): string {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleTimeString(locale);
}

/**
 * Format Firebase Timestamp as locale date and time string
 */
export function formatTimestampDateTime(timestamp: Timestamp | undefined | null, locale?: string): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale)}`;
}

/**
 * Get time difference between two timestamps in milliseconds
 */
export function getTimestampDiff(timestamp1: Timestamp, timestamp2: Timestamp): number {
  return timestamp1.toMillis() - timestamp2.toMillis();
}

/**
 * Check if timestamp is in the past
 */
export function isTimestampPast(timestamp: Timestamp): boolean {
  return timestamp.toMillis() < Date.now();
}

/**
 * Check if timestamp is in the future
 */
export function isTimestampFuture(timestamp: Timestamp): boolean {
  return timestamp.toMillis() > Date.now();
}

/**
 * Compare two timestamps
 * Returns: -1 if t1 < t2, 0 if equal, 1 if t1 > t2
 */
export function compareTimestamps(t1: Timestamp, t2: Timestamp): number {
  const diff = t1.toMillis() - t2.toMillis();
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return 0;
}

/**
 * Format timestamp as "time ago" string
 */
export function formatTimeAgo(timestamp: Timestamp): string {
  const now = Date.now();
  const diff = now - timestamp.toMillis();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Format timestamp as days ago
 */
export function formatDaysAgo(timestamp: Timestamp): string {
  const now = Date.now();
  const diff = now - timestamp.toMillis();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/**
 * Format date for display
 */
export function formatDate(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleDateString();
}
