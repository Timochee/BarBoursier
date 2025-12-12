import { db } from '../db/connection';

// Check if a record exists by name (case-insensitive), optionally excluding an ID
export function recordExists(table: string, name: string, excludeId?: number): boolean {
  if (excludeId) {
    const stmt = db.prepare(`SELECT 1 FROM ${table} WHERE LOWER(name) = LOWER(?) AND id != ?`);
    return stmt.get(name, excludeId) !== undefined;
  }
  const stmt = db.prepare(`SELECT 1 FROM ${table} WHERE LOWER(name) = LOWER(?)`);
  return stmt.get(name) !== undefined;
}

// Build dynamic UPDATE query from partial object
export function buildUpdateQuery<T extends Record<string, unknown>>(
  table: string,
  id: number,
  data: Partial<T>,
  fieldMappings: Record<keyof T, string>
): { sql: string; values: unknown[] } | null {
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const [key, column] of Object.entries(fieldMappings)) {
    const value = data[key as keyof T];
    if (value !== undefined) {
      updates.push(`${column} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) return null;

  values.push(id);
  return {
    sql: `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`,
    values,
  };
}
