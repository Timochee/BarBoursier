import { db } from '../db/connection';
import type { Admin } from 'shared';

export class AdminRepository {
  getAll(): Admin[] {
    const stmt = db.prepare(`
      SELECT id, email, name, added_at as addedAt, added_by as addedBy
      FROM admins
      ORDER BY added_at DESC
    `);
    return stmt.all() as Admin[];
  }

  getByEmail(email: string): Admin | undefined {
    const stmt = db.prepare(`
      SELECT id, email, name, added_at as addedAt, added_by as addedBy
      FROM admins
      WHERE email = ?
    `);
    return stmt.get(email) as Admin | undefined;
  }

  isAdmin(email: string): boolean {
    const stmt = db.prepare('SELECT 1 FROM admins WHERE email = ?');
    return stmt.get(email) !== undefined;
  }

  add(email: string, name: string, addedBy: string): Admin {
    const stmt = db.prepare(`
      INSERT INTO admins (email, name, added_by)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(email, name, addedBy);
    return this.getByEmail(email)!;
  }

  remove(email: string): boolean {
    const stmt = db.prepare('DELETE FROM admins WHERE email = ?');
    const result = stmt.run(email);
    return result.changes > 0;
  }

  removeById(id: number): boolean {
    const stmt = db.prepare('DELETE FROM admins WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export const adminRepository = new AdminRepository();
