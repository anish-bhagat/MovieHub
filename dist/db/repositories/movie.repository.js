"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieRepository = void 0;
class MovieRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    mapRow(row) {
        let languages = [];
        try {
            languages = JSON.parse(row.languages || '[]');
        }
        catch {
            languages = [];
        }
        return {
            id: row.id,
            name: row.name,
            title: row.name,
            releaseYear: row.release_year,
            genre: row.genre,
            durationMinutes: row.duration_minutes,
            rating: row.rating,
            ratingValue: row.rating,
            languages,
            certificate: row.certificate,
            posterUrl: row.poster_url,
            posterTitle: row.name.slice(0, 3).toUpperCase(),
            art: row.art || 'art-ember',
            description: row.description,
            active: Boolean(row.active),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    findAll(onlyActive = false) {
        const query = onlyActive
            ? 'SELECT * FROM movies WHERE active = 1 ORDER BY id DESC'
            : 'SELECT * FROM movies ORDER BY id DESC';
        const rows = this.db.prepare(query).all();
        return rows.map((r) => this.mapRow(r));
    }
    findById(id) {
        const row = this.db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
        return row ? this.mapRow(row) : null;
    }
    create(data) {
        const stmt = this.db.prepare(`
      INSERT INTO movies (name, release_year, genre, duration_minutes, rating, languages, certificate, poster_url, art, description, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(data.name, data.releaseYear, data.genre, data.durationMinutes, data.rating, JSON.stringify(data.languages || []), data.certificate || 'U/A', data.posterUrl || null, data.art || 'art-ember', data.description, data.active !== false ? 1 : 0);
        const insertedId = Number(result.lastInsertRowid);
        const created = this.findById(insertedId);
        if (!created)
            throw new Error('Failed to retrieve newly created movie');
        return created;
    }
    update(id, data) {
        const existing = this.findById(id);
        if (!existing)
            return null;
        const name = data.name !== undefined ? data.name : existing.name;
        const releaseYear = data.releaseYear !== undefined ? data.releaseYear : existing.releaseYear;
        const genre = data.genre !== undefined ? data.genre : existing.genre;
        const durationMinutes = data.durationMinutes !== undefined ? data.durationMinutes : existing.durationMinutes;
        const rating = data.rating !== undefined ? data.rating : existing.rating;
        const languages = data.languages !== undefined ? data.languages : existing.languages;
        const certificate = data.certificate !== undefined ? data.certificate : existing.certificate;
        const posterUrl = data.posterUrl !== undefined ? data.posterUrl : existing.posterUrl;
        const art = data.art !== undefined ? data.art : existing.art;
        const description = data.description !== undefined ? data.description : existing.description;
        const active = data.active !== undefined ? (data.active ? 1 : 0) : (existing.active ? 1 : 0);
        this.db.prepare(`
      UPDATE movies
      SET name = ?, release_year = ?, genre = ?, duration_minutes = ?, rating = ?, languages = ?, certificate = ?, poster_url = ?, art = ?, description = ?, active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, releaseYear, genre, durationMinutes, rating, JSON.stringify(languages), certificate, posterUrl, art, description, active, id);
        return this.findById(id);
    }
    countActive() {
        const row = this.db.prepare('SELECT COUNT(*) as cnt FROM movies WHERE active = 1').get();
        return row ? row.cnt : 0;
    }
}
exports.MovieRepository = MovieRepository;
//# sourceMappingURL=movie.repository.js.map