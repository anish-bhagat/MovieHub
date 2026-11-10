import { DatabaseSync } from 'node:sqlite';
import { Cinema, CreateCinemaDTO, UpdateCinemaDTO } from '../../types/index.js';

interface CinemaRow {
  id: number;
  name: string;
  city: string;
  address: string;
  map_url: string | null;
  amenities: string;
  late_night: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export class CinemaRepository {
  constructor(private db: DatabaseSync) {}

  private mapRow(row: CinemaRow): Cinema {
    let amenities: string[] = [];
    try {
      amenities = JSON.parse(row.amenities || '[]');
    } catch {
      amenities = [];
    }

    return {
      id: row.id,
      name: row.name,
      city: row.city,
      address: row.address,
      mapUrl: row.map_url,
      amenities,
      lateNight: Boolean(row.late_night),
      active: Boolean(row.active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  findAll(onlyActive = false): Cinema[] {
    const query = onlyActive
      ? 'SELECT * FROM cinemas WHERE active = 1 ORDER BY city ASC, name ASC'
      : 'SELECT * FROM cinemas ORDER BY city ASC, name ASC';
    const rows = this.db.prepare(query).all() as unknown as CinemaRow[];
    return rows.map((r) => this.mapRow(r));
  }

  findById(id: number): Cinema | null {
    const row = this.db.prepare('SELECT * FROM cinemas WHERE id = ?').get(id) as unknown as CinemaRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  create(data: CreateCinemaDTO): Cinema {
    const stmt = this.db.prepare(`
      INSERT INTO cinemas (name, city, address, map_url, amenities, late_night, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.city,
      data.address,
      data.mapUrl || null,
      JSON.stringify(data.amenities || []),
      data.lateNight ? 1 : 0,
      data.active !== false ? 1 : 0
    );

    const insertedId = Number(result.lastInsertRowid);
    const created = this.findById(insertedId);
    if (!created) throw new Error('Failed to retrieve newly created cinema');
    return created;
  }

  update(id: number, data: UpdateCinemaDTO): Cinema | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const city = data.city !== undefined ? data.city : existing.city;
    const address = data.address !== undefined ? data.address : existing.address;
    const mapUrl = data.mapUrl !== undefined ? data.mapUrl : existing.mapUrl;
    const amenities = data.amenities !== undefined ? data.amenities : existing.amenities;
    const lateNight = data.lateNight !== undefined ? (data.lateNight ? 1 : 0) : (existing.lateNight ? 1 : 0);
    const active = data.active !== undefined ? (data.active ? 1 : 0) : (existing.active ? 1 : 0);

    this.db.prepare(`
      UPDATE cinemas
      SET name = ?, city = ?, address = ?, map_url = ?, amenities = ?, late_night = ?, active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, city, address, mapUrl, JSON.stringify(amenities), lateNight, active, id);

    return this.findById(id);
  }

  countActive(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM cinemas WHERE active = 1').get() as { cnt: number };
    return row ? row.cnt : 0;
  }
}
