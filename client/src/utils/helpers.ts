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
 * Extract error message from unknown error type with fallback
 */
export function getErrorMessage(error: unknown, defaultMsg: string): string {
  return error instanceof Error ? error.message : defaultMsg;
}
