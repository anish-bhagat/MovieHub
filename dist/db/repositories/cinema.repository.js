"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinemaRepository = void 0;
class CinemaRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    mapRow(row) {
        let amenities = [];
        try {
            amenities = JSON.parse(row.amenities || '[]');
        }
        catch {
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
    findAll(onlyActive = false) {
        const query = onlyActive
            ? 'SELECT * FROM cinemas WHERE active = 1 ORDER BY city ASC, name ASC'
            : 'SELECT * FROM cinemas ORDER BY city ASC, name ASC';
        const rows = this.db.prepare(query).all();
        return rows.map((r) => this.mapRow(r));
    }
    findById(id) {
        const row = this.db.prepare('SELECT * FROM cinemas WHERE id = ?').get(id);
        return row ? this.mapRow(row) : null;
    }
    create(data) {
        const stmt = this.db.prepare(`
      INSERT INTO cinemas (name, city, address, map_url, amenities, late_night, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(data.name, data.city, data.address, data.mapUrl || null, JSON.stringify(data.amenities || []), data.lateNight ? 1 : 0, data.active !== false ? 1 : 0);
        const insertedId = Number(result.lastInsertRowid);
        const created = this.findById(insertedId);
        if (!created)
            throw new Error('Failed to retrieve newly created cinema');
        return created;
    }
    update(id, data) {
        const existing = this.findById(id);
        if (!existing)
            return null;
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
    countActive() {
        const row = this.db.prepare('SELECT COUNT(*) as cnt FROM cinemas WHERE active = 1').get();
        return row ? row.cnt : 0;
    }
}
exports.CinemaRepository = CinemaRepository;
//# sourceMappingURL=cinema.repository.js.map