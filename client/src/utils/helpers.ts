/**
 * Shared utility functions for the frontend
 */

/**
 * Format a date string to French locale format (e.g., "10 dec. 2024")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a timestamp to French time format (HH:mm)
 */
export function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timestamp;
  }
}

/**
 * Format a timestamp to French time with seconds (HH:mm:ss)
 */
export function formatDateTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return `Transaction #${timestamp}`;
    return date.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return `Transaction #${timestamp}`;
  }
}

/**
 * Extract error message from unknown error type with fallback
 */
export function getErrorMessage(error: unknown, defaultMsg: string): string {
  return error instanceof Error ? error.message : defaultMsg;
}
