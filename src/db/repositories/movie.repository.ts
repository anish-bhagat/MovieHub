import { DatabaseSync } from 'node:sqlite';
import { Movie, CreateMovieDTO, UpdateMovieDTO } from '../../types/index.js';

interface MovieRow {
  id: number;
  name: string;
  release_year: number;
  genre: string;
  duration_minutes: number;
  rating: number;
  languages: string;
  certificate: string;
  poster_url: string | null;
  art: string;
  description: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export class MovieRepository {
  constructor(private db: DatabaseSync) {}

  private mapRow(row: MovieRow): Movie {
    let languages: string[] = [];
    try {
      languages = JSON.parse(row.languages || '[]');
    } catch {
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

  findAll(onlyActive = false): Movie[] {
    const query = onlyActive
      ? 'SELECT * FROM movies WHERE active = 1 ORDER BY id DESC'
      : 'SELECT * FROM movies ORDER BY id DESC';
    const rows = this.db.prepare(query).all() as unknown as MovieRow[];
    return rows.map((r) => this.mapRow(r));
  }

  findById(id: number): Movie | null {
    const row = this.db.prepare('SELECT * FROM movies WHERE id = ?').get(id) as unknown as MovieRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  create(data: CreateMovieDTO): Movie {
    const stmt = this.db.prepare(`
      INSERT INTO movies (name, release_year, genre, duration_minutes, rating, languages, certificate, poster_url, art, description, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.releaseYear,
      data.genre,
      data.durationMinutes,
      data.rating,
      JSON.stringify(data.languages || []),
      data.certificate || 'U/A',
      data.posterUrl || null,
      data.art || 'art-ember',
      data.description,
      data.active !== false ? 1 : 0
    );

    const insertedId = Number(result.lastInsertRowid);
    const created = this.findById(insertedId);
    if (!created) throw new Error('Failed to retrieve newly created movie');
    return created;
  }

  update(id: number, data: UpdateMovieDTO): Movie | null {
    const existing = this.findById(id);
    if (!existing) return null;

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

  countActive(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM movies WHERE active = 1').get() as { cnt: number };
    return row ? row.cnt : 0;
  }
}
