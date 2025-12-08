import { db } from '../db/connection';
import type { Preset, BeerDefinition } from 'shared';

interface PresetRow {
  id: number;
  name: string;
  description: string | null;
  beers: string;
  created_at: string;
  created_by: string;
}

export class PresetRepository {
  private rowToPreset(row: PresetRow): Preset {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      beers: JSON.parse(row.beers) as BeerDefinition[],
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }

  getAll(): Preset[] {
    const stmt = db.prepare(`
      SELECT id, name, description, beers, created_at, created_by
      FROM presets
      ORDER BY name
    `);
    const rows = stmt.all() as PresetRow[];
    return rows.map(row => this.rowToPreset(row));
  }

  getById(id: number): Preset | undefined {
    const stmt = db.prepare(`
      SELECT id, name, description, beers, created_at, created_by
      FROM presets
      WHERE id = ?
    `);
    const row = stmt.get(id) as PresetRow | undefined;
    return row ? this.rowToPreset(row) : undefined;
  }

  create(preset: {
    name: string;
    description?: string;
    beers: BeerDefinition[];
    createdBy: string;
  }): Preset {
    const stmt = db.prepare(`
      INSERT INTO presets (name, description, beers, created_by)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      preset.name,
      preset.description || null,
      JSON.stringify(preset.beers),
      preset.createdBy
    );

    return {
      id: result.lastInsertRowid as number,
      name: preset.name,
      description: preset.description,
      beers: preset.beers,
      createdAt: new Date().toISOString(),
      createdBy: preset.createdBy,
    };
  }

  update(id: number, preset: {
    name?: string;
    description?: string;
    beers?: BeerDefinition[];
  }): Preset | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (preset.name !== undefined) {
      updates.push('name = ?');
      values.push(preset.name);
    }
    if (preset.description !== undefined) {
      updates.push('description = ?');
      values.push(preset.description || null);
    }
    if (preset.beers !== undefined) {
      updates.push('beers = ?');
      values.push(JSON.stringify(preset.beers));
    }

    if (updates.length === 0) return existing;

    values.push(id.toString());
    const stmt = db.prepare(`UPDATE presets SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getById(id);
  }

  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM presets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  exists(name: string, excludeId?: number): boolean {
    if (excludeId) {
      const stmt = db.prepare('SELECT 1 FROM presets WHERE LOWER(name) = LOWER(?) AND id != ?');
      return stmt.get(name, excludeId) !== undefined;
    }
    const stmt = db.prepare('SELECT 1 FROM presets WHERE LOWER(name) = LOWER(?)');
    return stmt.get(name) !== undefined;
  }

  // Save current beers as a new preset
  saveCurrentAsPreset(name: string, description: string | undefined, createdBy: string): Preset {
    const beersStmt = db.prepare(`
      SELECT name, base_price as basePrice, category, volatility
      FROM beers
      ORDER BY category, name
    `);
    const beers = beersStmt.all() as BeerDefinition[];

    return this.create({
      name,
      description,
      beers,
      createdBy,
    });
  }
}

export const presetRepository = new PresetRepository();
